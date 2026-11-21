export type ProductStatus = "Available" | "In development" | "Concept";
export type ProductCategory = "Social" | "Media" | "Developer" | "Gaming" | "System" | "Utilities";
export type Product = {
  slug: string;
  name: string;
  eyebrow: string;
  tagline: string;
  description: string;
  category: ProductCategory;
  status: ProductStatus;
  symbol: string;
  featured?: boolean;
  websiteUrl?: string;
  repoUrl?: string;
  tags: string[];
};
