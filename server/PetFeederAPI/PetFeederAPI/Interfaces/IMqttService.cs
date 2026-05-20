namespace PetFeederAPI.Interfaces;

public interface IMqttService
{
    string FoodLevel { get; }
    string EspStatus { get; }
    Task PublishAsync(string topic, string payload);
    Task ReconnectAsync();
}