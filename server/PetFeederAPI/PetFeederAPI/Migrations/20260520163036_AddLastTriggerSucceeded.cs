using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PetFeederAPI.Migrations
{
    /// <inheritdoc />
    public partial class AddLastTriggerSucceeded : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "LastTriggerSucceeded",
                table: "ScheduledFeeds",
                type: "boolean",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastTriggerSucceeded",
                table: "ScheduledFeeds");
        }
    }
}
