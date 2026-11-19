export type KitchenBrand = 'Blue Zenzer' | 'Blue Ginger';
export type DietaryType = 'veg' | 'non-veg';
export type SpiceTag = 'N' | 'M' | 'S' | 'EX';
export type MenuCategory = 'starter' | 'main' | 'side' | 'rice' | 'dessert' | 'drink';

export interface MenuItem {
  id: string;
  name: string;
  kitchenLabel: string;
  kitchen: KitchenBrand;
  category: MenuCategory;
  dietary: DietaryType;
  tags: SpiceTag[];
  description?: string;
}

export type DrinksPackageOption = 'Included' | 'Not Included';
export type ServiceStyleOption = 'Buffet' | 'Table Service';

export interface CustomerDetails {
  name: string;
  email: string;
  phone: string;
  eventDate: string; // ISO YYYY-MM-DD
  eventTime: string; // e.g., "1700"
  startersTime: string; // e.g., "1800"
  adults: number;
  kids: number;
  area: string;
  deposit: number;
  drinksPackage: DrinksPackageOption;
  serviceStyle: ServiceStyleOption;
  golfIncluded: boolean;
  golfCost: number;
  allergies: string;
  specialRequests: string;
  notes: string;
  setupDetails: string;
  includeFixedIndianAccompaniments: boolean;
  extraAccompanimentDal: string; // optional dal dish like Dal Makhani
  includeTeaAndCoffee: boolean;
  consentTerms: boolean;
  consentContact: boolean;
  consentMarketing: boolean;
  signatureName: string;
}

export interface MenuSelection {
  starters: string[]; // 4 included, optional 5th (+£1/pp)
  mains: string[]; // 4 included, optional 5th (+£1/pp)
  desserts: string[]; // 1 included, optional 2nd (+£1/pp)
  dessert?: string | null; // legacy fallback for previously saved bookings
  rice: string | null; // optional 1 rice ID
  side: string | null; // optional 1 side order ID
  drinks: string[]; // up to 4 drink IDs
}

export type BookingStatus = 'Locked & Submitted' | 'In Kitchen Prep' | 'Completed';

export interface SavedBooking {
  id: string;
  createdAt: string;
  status: BookingStatus;
  details: CustomerDetails;
  selection: MenuSelection;
}
