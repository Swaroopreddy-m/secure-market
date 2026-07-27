import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.number().positive("Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  category: z.string().min(1, "Category is required"),
  image: z.string().url("Valid image URL is required"),
  inStock: z.boolean().default(true),
});

export const orderSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    quantity: z.number().int().positive(),
    price: z.number().positive(),
  })).min(1, "At least one item is required"),
  totalAmount: z.number().positive(),
  deliveryStreet: z.string().min(1, "Street is required"),
  deliveryCity: z.string().min(1, "City is required"),
  deliveryPhone: z.string().min(1, "Phone is required"),
});

export const addressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  phone: z.string().min(1, "Phone is required"),
  isDefault: z.boolean().optional(),
});
