#include <Wire.h>
#include <WiFi.h>
#include <time.h>
#include <FirebaseESP32.h>
#include <MAX30105.h>
#include <heartRate.h>
#include <TinyGPS++.h>
#include <Adafruit_MLX90614.h>
#include "secrets.h"   // ← credentials live here, never commit this file

// ─────────────────────────────────────────
//  CONFIGURATION
// ─────────────────────────────────────────
#define PUBLISH_INTERVAL 2000   // ms between each Firebase push

// NTP settings — IST = UTC + 5:30 = 19800 seconds
#define NTP_SERVER   "pool.ntp.org"
#define GMT_OFFSET   19800
#define DST_OFFSET   0

// ─────────────────────────────────────────
//  SENSOR & PERIPHERAL INSTANCES
// ─────────────────────────────────────────
MAX30105          particleSensor;
Adafruit_MLX90614 mlx;
TinyGPSPlus       gps;
HardwareSerial    gpsSerial(2);

// ─────────────────────────────────────────
//  FIREBASE INSTANCES
// ─────────────────────────────────────────
FirebaseData   fbdo;
FirebaseAuth   fbAuth;
FirebaseConfig fbConfig;

// ─────────────────────────────────────────
//  HEART RATE STATE
// ─────────────────────────────────────────
const byte RATE_SIZE     = 4;
byte       rates[RATE_SIZE];
byte       rateSpot      = 0;
long       lastBeat      = 0;
float      beatsPerMinute = 0;
int        beatAvg       = 0;

// ─────────────────────────────────────────
//  TIMING
// ─────────────────────────────────────────
unsigned long lastPublish = 0;

// ─────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────

// Wi-Fi connection with 15-second timeout
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[OK] Wi-Fi Connected! IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\n[WARN] Wi-Fi FAILED! Running in offline mode.");
  }
}

// Sync real clock from NTP
void syncNTP() {
  configTime(GMT_OFFSET, DST_OFFSET, NTP_SERVER);
  Serial.print("Syncing NTP time");
  struct tm timeinfo;
  unsigned long start = millis();
  while (!getLocalTime(&timeinfo) && millis() - start < 8000) {
    delay(500);
    Serial.print(".");
  }
  if (getLocalTime(&timeinfo)) {
    char buf[32];
    strftime(buf, sizeof(buf), "%Y-%m-%d %H:%M:%S", &timeinfo);
    Serial.println("\n[OK] NTP Synced: " + String(buf) + " IST");
  } else {
    Serial.println("\n[WARN] NTP sync failed. Timestamps may be inaccurate.");
  }
}

// SpO2 estimation from IR value
int calcSpO2(long irValue) {
  return constrain((int)map(irValue, 50000, 120000, 94, 100), 90, 100);
}

// Get current Unix timestamp (real UTC time)
long getUnixTimestamp() {
  time_t now;
  time(&now);
  return (long)now;
}

// ─────────────────────────────────────────
//  SETUP
// ─────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(500);
  Wire.begin(21, 22);

  Serial.println("\n=============================");
  Serial.println("  IIT Jodhpur Health Tracker");
  Serial.println("=============================");

  // MLX90614
  if (!mlx.begin()) {
    Serial.println("[ERROR] MLX90614 not found! Check wiring.");
    while (1);
  }
  Serial.println("[OK] MLX90614 ready");

  // MAX30102
  if (!particleSensor.begin(Wire, I2C_SPEED_STANDARD)) {
    Serial.println("[ERROR] MAX30102 not found! Check wiring.");
    while (1);
  }
  particleSensor.setup(60, 4, 2, 100, 411, 4096);
  particleSensor.setPulseAmplitudeRed(0x24);
  particleSensor.setPulseAmplitudeIR(0x24);
  particleSensor.setPulseAmplitudeGreen(0);
  Serial.println("[OK] MAX30102 ready");

  // GPS
  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);
  Serial.println("[OK] GPS started on RX=16, TX=17");

  // Wi-Fi
  connectWiFi();

  // NTP (only if Wi-Fi connected)
  if (WiFi.status() == WL_CONNECTED) {
    syncNTP();
  }

  // Firebase
  fbConfig.host = FIREBASE_HOST;
  fbConfig.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&fbConfig, &fbAuth);
  Firebase.reconnectWiFi(true);
  Serial.println("[OK] Firebase configured");

  Serial.println("\n[READY] Entering main loop...\n");
}

// ─────────────────────────────────────────
//  LOOP
// ─────────────────────────────────────────
void loop() {

  // 1. Feed GPS parser
  while (gpsSerial.available())
    gps.encode(gpsSerial.read());

  // 2. Heart Rate computation
  long irValue = particleSensor.getIR();
  if (irValue > 50000 && checkForBeat(irValue)) {
    long delta   = millis() - lastBeat;
    lastBeat     = millis();
    beatsPerMinute = 60.0 / (delta / 1000.0);
    if (beatsPerMinute > 20 && beatsPerMinute < 255) {
      rates[rateSpot++] = (byte)beatsPerMinute;
      rateSpot %= RATE_SIZE;
      beatAvg = 0;
      for (byte x = 0; x < RATE_SIZE; x++) beatAvg += rates[x];
      beatAvg /= RATE_SIZE;
    }
  }

  // 3. Publish every PUBLISH_INTERVAL ms
  if (millis() - lastPublish >= PUBLISH_INTERVAL) {
    lastPublish = millis();

    // Read sensors
    float ambientTemp = mlx.readAmbientTempC();
    float bodyTemp    = mlx.readObjectTempC();
    bool  fingerOn    = (irValue > 50000);
    int   spo2        = fingerOn ? calcSpO2(irValue) : 0;
    int   bpm         = fingerOn ? beatAvg : 0;
    double lat        = gps.location.isValid() ? gps.location.lat() : 0.0;
    double lng        = gps.location.isValid() ? gps.location.lng() : 0.0;

    // Print to Serial Monitor
    Serial.println("================================");
    Serial.print("Ambient Temp : "); Serial.print(ambientTemp); Serial.println(" C");
    Serial.print("Body Temp    : "); Serial.print(bodyTemp);    Serial.println(" C");
    if (fingerOn) {
      Serial.print("Heart Rate   : "); Serial.print(bpm);  Serial.println(" BPM");
      Serial.print("SpO2         : "); Serial.print(spo2); Serial.println(" %");
    } else {
      Serial.println("Heart Rate   : Place Finger");
      Serial.println("SpO2         : Place Finger");
    }
    if (gps.location.isValid()) {
      Serial.print("Latitude     : "); Serial.println(lat, 6);
      Serial.print("Longitude    : "); Serial.println(lng, 6);
      Serial.print("Satellites   : "); Serial.println(gps.satellites.value());
    } else {
      Serial.println("GPS          : Waiting For Fix...");
    }

    // Auto-reconnect Wi-Fi if dropped
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WARN] Wi-Fi lost! Reconnecting...");
      connectWiFi();
      if (WiFi.status() == WL_CONNECTED) syncNTP();
    }

    // Push to Firebase
    if (WiFi.status() == WL_CONNECTED && Firebase.ready()) {
      FirebaseJson json;
      json.set("beatAvg",     bpm);
      json.set("spo2",        spo2);
      json.set("bodyTemp",    bodyTemp);
      json.set("ambientTemp", ambientTemp);
      json.set("lat",         lat);
      json.set("lng",         lng);
      json.set("timestamp",   getUnixTimestamp()); // Real UTC Unix timestamp

      if (Firebase.updateNode(fbdo, "/vitals", json)) {
        Serial.println("[Firebase] Upload Success!");
      } else {
        Serial.print("[Firebase] Failed: ");
        Serial.println(fbdo.errorReason());
      }
    } else {
      Serial.println("[Firebase] Skipped - No Wi-Fi");
    }

    Serial.println("================================\n");
  }

  delay(10);
}
