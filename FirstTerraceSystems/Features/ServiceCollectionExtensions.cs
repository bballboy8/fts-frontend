using System;
using System.IO;
using Microsoft.Extensions.DependencyInjection;
using FirstTerraceSystems.Services;

namespace FirstTerraceSystems.Features
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddDatabaseService(this IServiceCollection builder)
        {
            builder.AddSingleton<DatabaseService>(serviceProvider =>
            {
                // Get the database path
                string dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "FTS.db");

                // Check if the database file exists
                // if (File.Exists(dbPath))
                // {
                //     // Delete the existing database file
                //     File.Delete(dbPath);
                //     Console.WriteLine("Existing database has been deleted.");
                // }

                // Initialize a new DatabaseService with the (possibly) new database
                return new DatabaseService(dbPath);
            });

            return builder;
        }
    }
}
