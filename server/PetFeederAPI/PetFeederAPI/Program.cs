using PetFeederAPI.Db;
using PetFeederAPI.Interfaces;
using PetFeederAPI.Services;
using Microsoft.EntityFrameworkCore;
using PetFeederAPI.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.Configure<FlespiOptions>(builder.Configuration.GetSection("Flespi"));
builder.Services.AddOpenApiDocument(config =>
{
    config.Title = "Pet Feeder API";
    config.Version = "v1";
});
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddSingleton<MqttService>();
builder.Services.AddSingleton<IMqttService>(sp => sp.GetRequiredService<MqttService>());
builder.Services.AddHostedService(sp => sp.GetRequiredService<MqttService>());
builder.Services.AddHostedService<FeedSchedulerService>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseOpenApi();
    app.UseSwaggerUi();
}

app.UseCors("AllowFrontend");
app.UseHttpsRedirection();
app.MapControllers();

app.Run();