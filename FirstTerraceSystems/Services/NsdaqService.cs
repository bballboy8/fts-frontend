﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using FirstTerraceSystems.Entities.Nasdaq;

namespace FirstTerraceSystems.Services
{
    public class NsdaqService
    {
        private readonly HttpClient _client;

        public NsdaqService()
        {
            _client = new HttpClient();
        }

        // Method to fetch data for a specific symbol
        public async Task<IEnumerable<EquitiesBarModal>?> GetEquitiesBars(DateTime startDate, string symbol)
        {
            var requestUrl = "http://52.72.116.51:8000/nasdaq/get_data";
            var requestData = new
            {
                start_datetime = startDate.ToString("yyyy-MM-ddTHH:mm"),
                symbol = symbol
            };

            var requestContent = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");

            try
            {
                var response = await _client.PostAsync(requestUrl, requestContent);
                response.EnsureSuccessStatusCode();
                var contentString = await response.Content.ReadAsStringAsync();
                var equitiesBars = JsonSerializer.Deserialize<IEnumerable<EquitiesBarModal>>(contentString);
                return equitiesBars;
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error fetching equities bars: {ex.Message}");
                return null;
            }
        }

        // New method to fetch the list of symbols
        public async Task<IEnumerable<SymbolModel>?> GetSymbols()
        {
            var requestUrl = "http://52.72.116.51:8000/nasdaq/get_tickers";

            try
            {
                var response = await _client.GetAsync(requestUrl);
                response.EnsureSuccessStatusCode();
                var contentString = await response.Content.ReadAsStringAsync();

                // Log the raw API response
                Console.WriteLine("Raw API Response: " + contentString);

                // Deserialize the response
                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                var symbols = JsonSerializer.Deserialize<IEnumerable<SymbolModel>>(contentString, options);
                return symbols;
            }
            catch (JsonException jsonEx)
            {
                // Log JSON deserialization exception
                Console.WriteLine($"JSON Error: {jsonEx.Message}");
                return null;
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error fetching symbols: {ex.Message}");
                return null;
            }
        }
    }

    public class SymbolModel
    {
        public string? Symbol { get; set; }
    }
}