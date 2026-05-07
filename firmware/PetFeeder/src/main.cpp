#include <WiFi.h>
#include <PubSubClient.h>
#include <AccelStepper.h>
#include "credentials.h"

// LED pins
#define LED_GREEN  2   // WiFi connected
#define LED_RED    4   // No WiFi
#define LED_ORANGE 16  // Food low

// Stepper pins
#define IN1 12
#define IN2 13
#define IN3 14
#define IN4 15

AccelStepper stepper(AccelStepper::HALF4WIRE, IN1, IN3, IN2, IN4);

WiFiClient espClient;
PubSubClient client(espClient);


void feedNow() {
    Serial.println("Dispensing food...");
    stepper.move(2048); // one full rotation
    while (stepper.distanceToGo() != 0) {
        stepper.run();
    }
    Serial.println("Done!");
    client.publish("petfeeder/fed", "true");
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
    String message;
    for (int i = 0; i < length; i++) {
        message += (char)payload[i];
    }
    Serial.print("MQTT message received: ");
    Serial.println(message);

    if (String(topic) == "petfeeder/command" && message == "feed") {
        feedNow();
    }
}

void setLeds(bool wifiOn) {
    digitalWrite(LED_GREEN, wifiOn ? HIGH : LOW);
    digitalWrite(LED_RED,   wifiOn ? LOW : HIGH);
}

void connectWiFi() {
    WiFi.disconnect();
    WiFi.mode(WIFI_STA);
    Serial.print("Connecting to WiFi");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println(" connected!");
    setLeds(true);
}

void connectMQTT() {
    client.setServer(MQTT_BROKER, MQTT_PORT);
    client.setCallback(mqttCallback);
    Serial.print("Connecting to Flespi...");
    while (!client.connected()) {
        if (client.connect("PetFeeder", FLESPI_TOKEN, "")) {
            Serial.println("connected!");
            client.subscribe("petfeeder/command");
            client.publish("petfeeder/status", "online");
        } else {
            Serial.print("failed, error code: ");
            Serial.println(client.state());
            delay(1000);
        }
    }
}

void setup() {
    Serial.begin(115200);

    pinMode(LED_GREEN,  OUTPUT);
    pinMode(LED_RED,    OUTPUT);
    pinMode(LED_ORANGE, OUTPUT);

    // Start with red on (not connected yet)
    setLeds(false);
    
    stepper.setMaxSpeed(1000);
    stepper.setAcceleration(500);

    connectWiFi();
    connectMQTT();
}

void loop() {
    if (WiFi.status() != WL_CONNECTED) {
        setLeds(false);
        connectWiFi();
        connectMQTT();
    } else if (!client.connected()) {
        setLeds(false);
        connectMQTT();
    }
    client.loop();
    stepper.run();
}