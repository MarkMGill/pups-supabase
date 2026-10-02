export type Puppy = {
  id: string;
  name: string;
  breed: string;
  ageMonths: number;
  priceCents: number;
  imageUrl: string;
  description: string;
};

export type AppUser = {
  id: string;
  email: string;
  name: string;
};

export type CartItem = {
  puppy: Puppy;
  quantity: number;
};