// ─── Canadian Tax Config ──────────────────────────────────────────────────
export const PROVINCES = {
  AB: { name: "Alberta",               gst: 0.05, pst: 0,      hst: 0     },
  BC: { name: "British Columbia",      gst: 0.05, pst: 0.07,   hst: 0     },
  MB: { name: "Manitoba",              gst: 0.05, pst: 0.07,   hst: 0     },
  NB: { name: "New Brunswick",         gst: 0,    pst: 0,      hst: 0.15  },
  NL: { name: "Newfoundland",          gst: 0,    pst: 0,      hst: 0.15  },
  NS: { name: "Nova Scotia",           gst: 0,    pst: 0,      hst: 0.15  },
  NT: { name: "NW Territories",        gst: 0.05, pst: 0,      hst: 0     },
  NU: { name: "Nunavut",               gst: 0.05, pst: 0,      hst: 0     },
  ON: { name: "Ontario",               gst: 0,    pst: 0,      hst: 0.13  },
  PE: { name: "Prince Edward Island",  gst: 0,    pst: 0,      hst: 0.15  },
  QC: { name: "Quebec",                gst: 0.05, pst: 0.09975,hst: 0     },
  SK: { name: "Saskatchewan",          gst: 0.05, pst: 0.06,   hst: 0     },
  YT: { name: "Yukon",                 gst: 0.05, pst: 0,      hst: 0     },
};

export const TAX_CATS = {
  grocery_basic: "exempt",
  grocery_snack: "gst_only",
  beverage_alc:  "full",
  tobacco:       "full",
  household:     "full",
  personal_care: "full",
  confectionery: "gst_only",
  prepared_food: "gst_only",
  lottery:       "exempt",
};

export function calcTax(subtotal, taxCat, provinceCode) {
  const prov = PROVINCES[provinceCode];
  if (!prov) return { gst: 0, pst: 0, hst: 0 };
  const cat = TAX_CATS[taxCat] || "full";
  if (cat === "exempt") return { gst: 0, pst: 0, hst: 0 };
  let gst = 0, pst = 0, hst = 0;
  if (prov.hst > 0) {
    hst = subtotal * prov.hst;
  } else {
    gst = subtotal * prov.gst;
    if (cat === "full") pst = subtotal * prov.pst;
  }
  return { gst, pst, hst };
}

// ─── Initial Inventory (used only to seed Supabase on first run) ─────────
export const INITIAL_INVENTORY = [
  { id: 1,  name: "Coca-Cola 355ml",      price: 1.99,  category: "Beverages",    taxCat: "gst_only",      stock: 48, barcode: "049000028904", emoji: "🥤", cost: 0.90, reorderAt: 12 },
  { id: 2,  name: "Pepsi 355ml",          price: 1.99,  category: "Beverages",    taxCat: "gst_only",      stock: 36, barcode: "012000001413", emoji: "🥤", cost: 0.88, reorderAt: 12 },
  { id: 3,  name: "Gatorade Blue",        price: 2.49,  category: "Beverages",    taxCat: "gst_only",      stock: 24, barcode: "052000131494", emoji: "🧃", cost: 1.10, reorderAt: 8 },
  { id: 4,  name: "Water 500ml",          price: 1.49,  category: "Beverages",    taxCat: "grocery_basic", stock: 60, barcode: "012000810019", emoji: "💧", cost: 0.20, reorderAt: 20 },
  { id: 5,  name: "Red Bull 250ml",       price: 3.49,  category: "Beverages",    taxCat: "gst_only",      stock: 20, barcode: "090569002011", emoji: "🔴", cost: 1.60, reorderAt: 8 },
  { id: 6,  name: "Tropicana OJ 1L",      price: 4.99,  category: "Beverages",    taxCat: "grocery_basic", stock: 18, barcode: "048500203231", emoji: "🍊", cost: 2.20, reorderAt: 6 },
  { id: 7,  name: "Lays Classic 200g",    price: 3.99,  category: "Snacks",       taxCat: "grocery_snack", stock: 20, barcode: "028400315036", emoji: "🥔", cost: 1.80, reorderAt: 8 },
  { id: 8,  name: "Doritos Nacho 200g",   price: 3.99,  category: "Snacks",       taxCat: "grocery_snack", stock: 15, barcode: "028400028028", emoji: "🌽", cost: 1.80, reorderAt: 6 },
  { id: 9,  name: "Pringles Original",    price: 4.49,  category: "Snacks",       taxCat: "grocery_snack", stock: 12, barcode: "038000845093", emoji: "🍟", cost: 2.00, reorderAt: 5 },
  { id: 10, name: "Clif Bar Choc Chip",   price: 2.99,  category: "Snacks",       taxCat: "grocery_snack", stock: 30, barcode: "722252100047", emoji: "🍫", cost: 1.30, reorderAt: 10 },
  { id: 11, name: "Trail Mix 150g",       price: 3.49,  category: "Snacks",       taxCat: "grocery_snack", stock: 25, barcode: "030000056271", emoji: "🥜", cost: 1.50, reorderAt: 8 },
  { id: 12, name: "Kit Kat 45g",          price: 1.99,  category: "Confectionery",taxCat: "confectionery", stock: 40, barcode: "059800005001", emoji: "🍫", cost: 0.80, reorderAt: 15 },
  { id: 13, name: "Reese's PB Cups",      price: 2.29,  category: "Confectionery",taxCat: "confectionery", stock: 35, barcode: "034000004973", emoji: "🍬", cost: 0.95, reorderAt: 12 },
  { id: 14, name: "Skittles 61g",         price: 1.79,  category: "Confectionery",taxCat: "confectionery", stock: 30, barcode: "022000010933", emoji: "🌈", cost: 0.70, reorderAt: 10 },
  { id: 15, name: "Extra Gum Spearmint",  price: 1.99,  category: "Confectionery",taxCat: "confectionery", stock: 25, barcode: "022000010261", emoji: "🟩", cost: 0.75, reorderAt: 8 },
  { id: 16, name: "Wonder Bread",         price: 3.49,  category: "Grocery",      taxCat: "grocery_basic", stock: 10, barcode: "064144000178", emoji: "🍞", cost: 1.40, reorderAt: 4 },
  { id: 17, name: "2% Milk 1L",           price: 2.99,  category: "Grocery",      taxCat: "grocery_basic", stock: 15, barcode: "059000001236", emoji: "🥛", cost: 1.50, reorderAt: 5 },
  { id: 18, name: "Eggs Doz.",            price: 4.99,  category: "Grocery",      taxCat: "grocery_basic", stock: 8,  barcode: "021130501021", emoji: "🥚", cost: 2.50, reorderAt: 3 },
  { id: 19, name: "Butter 454g",          price: 5.99,  category: "Grocery",      taxCat: "grocery_basic", stock: 12, barcode: "064144000185", emoji: "🧈", cost: 3.20, reorderAt: 4 },
  { id: 20, name: "Banana (ea.)",         price: 0.59,  category: "Grocery",      taxCat: "grocery_basic", stock: 40, barcode: "000000004011", emoji: "🍌", cost: 0.15, reorderAt: 10 },
  { id: 21, name: "Apple Gala (ea.)",     price: 0.99,  category: "Grocery",      taxCat: "grocery_basic", stock: 30, barcode: "000000003107", emoji: "🍎", cost: 0.30, reorderAt: 8 },
  { id: 22, name: "Hot Dog",              price: 2.49,  category: "Prepared",     taxCat: "prepared_food", stock: 20, barcode: "000000099001", emoji: "🌭", cost: 0.80, reorderAt: 8 },
  { id: 23, name: "Beef Jerky 50g",       price: 4.99,  category: "Prepared",     taxCat: "prepared_food", stock: 18, barcode: "017082877543", emoji: "🥩", cost: 2.00, reorderAt: 6 },
  { id: 24, name: "Cup Noodles",          price: 1.49,  category: "Prepared",     taxCat: "prepared_food", stock: 30, barcode: "070662096744", emoji: "🍜", cost: 0.40, reorderAt: 10 },
  { id: 25, name: "Tylenol Regular 24s",  price: 8.99,  category: "Personal Care",taxCat: "personal_care", stock: 10, barcode: "300450514095", emoji: "💊", cost: 3.50, reorderAt: 4 },
  { id: 26, name: "Advil 24s",            price: 9.99,  category: "Personal Care",taxCat: "personal_care", stock: 10, barcode: "305730169093", emoji: "💊", cost: 4.00, reorderAt: 4 },
  { id: 27, name: "Band-Aid 20s",         price: 4.99,  category: "Personal Care",taxCat: "personal_care", stock: 15, barcode: "381370011581", emoji: "🩹", cost: 1.50, reorderAt: 5 },
  { id: 28, name: "Colgate Toothpaste",   price: 5.49,  category: "Personal Care",taxCat: "personal_care", stock: 12, barcode: "035000511584", emoji: "🦷", cost: 2.20, reorderAt: 4 },
  { id: 29, name: "Shampoo H&S 200ml",    price: 6.99,  category: "Personal Care",taxCat: "personal_care", stock: 10, barcode: "037000862024", emoji: "🧴", cost: 2.80, reorderAt: 3 },
  { id: 30, name: "Bounty Paper Towels",  price: 3.99,  category: "Household",    taxCat: "household",     stock: 15, barcode: "037000863205", emoji: "🧻", cost: 1.60, reorderAt: 5 },
  { id: 31, name: "Scotties Tissues",     price: 2.99,  category: "Household",    taxCat: "household",     stock: 20, barcode: "056300191020", emoji: "🤧", cost: 1.20, reorderAt: 6 },
  { id: 32, name: "Ziploc Sandwich Bags", price: 3.49,  category: "Household",    taxCat: "household",     stock: 18, barcode: "025700001009", emoji: "🛍", cost: 1.40, reorderAt: 5 },
  { id: 33, name: "AA Batteries 4pk",     price: 6.99,  category: "Household",    taxCat: "household",     stock: 20, barcode: "039800016027", emoji: "🔋", cost: 2.80, reorderAt: 6 },
  { id: 34, name: "Lighter BIC",          price: 2.49,  category: "Household",    taxCat: "household",     stock: 30, barcode: "070330600011", emoji: "🔥", cost: 0.60, reorderAt: 10 },
  { id: 35, name: "Marlboro King 20s",    price: 14.99, category: "Tobacco",      taxCat: "tobacco",       stock: 50, barcode: "028000509879", emoji: "🚬", cost: 8.00, reorderAt: 15 },
  { id: 36, name: "Export A Blue 25s",    price: 16.99, category: "Tobacco",      taxCat: "tobacco",       stock: 40, barcode: "064144556781", emoji: "🚬", cost: 9.00, reorderAt: 10 },
  { id: 37, name: "Coors Light 473ml",    price: 3.49,  category: "Alcohol",      taxCat: "beverage_alc",  stock: 24, barcode: "055050301048", emoji: "🍺", cost: 1.50, reorderAt: 8 },
  { id: 38, name: "Molson Canadian 473ml",price: 3.49,  category: "Alcohol",      taxCat: "beverage_alc",  stock: 24, barcode: "055050004010", emoji: "🍺", cost: 1.50, reorderAt: 8 },
  { id: 39, name: "Smirnoff Ice 473ml",   price: 3.99,  category: "Alcohol",      taxCat: "beverage_alc",  stock: 18, barcode: "082000755321", emoji: "🍹", cost: 1.80, reorderAt: 6 },
  { id: 40, name: "Lotto 6/49 Ticket",    price: 3.00,  category: "Lottery",      taxCat: "lottery",       stock: 999, barcode: "000000000001", emoji: "🎟", cost: 3.00, reorderAt: 0 },
  { id: 41, name: "Scratch Ticket $5",    price: 5.00,  category: "Lottery",      taxCat: "lottery",       stock: 100, barcode: "000000000002", emoji: "🎰", cost: 5.00, reorderAt: 20 },
];

export const CHART_COLORS = ["#e63946","#2ec4b6","#f4a261","#457b9d","#a8dadc","#ffd166","#06d6a0","#ef476f"];
