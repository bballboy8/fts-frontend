﻿using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace FirstTerraceSystems.Models
{
    public class AuthResponse
    {
        public string? Access_Token { get; set; }
        public string? Token_Type { get; set; }
        public string? Message { get; set; }
        public string? Detail { get; set; }
    }
}
