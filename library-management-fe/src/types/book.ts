export type BookCategory =
  | "van-hoc"
  | "khoa-hoc"
  | "cong-nghe"
  | "lich-su"
  | "thieu-nhi"
  | "khac";

export interface Book {
  id: string;
  title: string;
  author: string;
  category: BookCategory;
  publishedYear: number;
  quantity: number;
  available: number;
  isbn?: string;
  tags?: string[];
  description?: string;
  summary?: string;
  imageUrl?: string;
  coverImageUrl?: string;
  coverUrl?: string;
  thumbnailUrl?: string;
  image?: string;
  note?: string;
  createdAt: string;
}

export type BookInput = Omit<Book, "id" | "createdAt">;

export interface BookQueryParams {
  page: number;
  pageSize: number;
  search?: string;
  category?: BookCategory | "all";
}

export interface PagedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
