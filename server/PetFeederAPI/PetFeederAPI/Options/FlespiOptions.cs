namespace PetFeederAPI.Options;

public class FlespiOptions
{
    public string Token { get; set; } = string.Empty;
    public string Broker { get; set; } = "mqtt.flespi.io";
    public int Port { get; set; } = 1883;
}