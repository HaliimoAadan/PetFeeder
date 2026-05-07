#include <WiFi.h>
#include <PubSubClient.h>
#include "credentials.h"

WiFiClient espClient;
PubSubClient client(espClient);

void connectWiFi() {
    WiFi.disconnect();
    WiFi.mode(WIFI_STA);
    Serial.print("Connecting to WiFi");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println(" connected");
}

void connectMQTT() {
    client.setServer(MQTT_BROKER, MQTT_PORT);
    Serial.print("Connecting to Flespi...");
    while (!client.connected()) {
        if (client.connect("PetFeeder", FLESPI_TOKEN, "")) {
            Serial.println("connected!");
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
    connectWiFi();
    connectMQTT();
}

void loop() {
    if (!client.connected()) {
        connectMQTT();
    }
    client.loop();
}