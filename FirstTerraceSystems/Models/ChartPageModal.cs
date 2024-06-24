using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.JSInterop;

namespace FirstTerraceSystems.Models
{
    public class ChartPageModal
    {
        public string? ChartId { get; set; }
        public IJSRuntime? JSRuntime { get; set; }

        public object? UpdatedMinExtreme { get; set; }
        public object? UpdatedMaxExtreme { get; set; }
        public object? Symbol { get; set; }
    }
}