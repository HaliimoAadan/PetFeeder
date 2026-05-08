namespace PetFeederAPI.Interfaces;

public interface IMqttService
{
    string FoodLevel { get; }
    Task PublishAsync(string topic, string payload);
}