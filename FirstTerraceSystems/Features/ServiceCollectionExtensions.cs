using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using FirstTerraceSystems.Repositories;

namespace FirstTerraceSystems.Features
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddDatabaseService(this IServiceCollection builder)
        {
            builder.AddSingleton<DatabaseContext>(serviceProvider =>
            {
                string dbPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "FTS.db");
                return new DatabaseContext(dbPath);
            });

            return builder;
        }
    }
}
