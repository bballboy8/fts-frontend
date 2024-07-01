using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Features
{
    public static class JsonElementExtensions
    {
        public static DateTime GetDateTime(this JsonElement element, string format)
        {
            if (DateTime.TryParseExact(element.GetString(), format, CultureInfo.InvariantCulture, DateTimeStyles.None, out DateTime dateTime))
            {
                return dateTime;
            }
            else
            {
                throw new FormatException("Failed to parse datetime from JsonElement.");
            }
        }
    }
}
