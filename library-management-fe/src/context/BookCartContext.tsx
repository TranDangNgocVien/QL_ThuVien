import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { Book } from "../types/book";

export interface CartItem {
  book: Book;
  quantity: number;
}

interface BookCartContextValue {
  cart: CartItem[];
  totalQuantity: number;
  addBook: (book: Book, quantity?: number) => void;
  updateQuantity: (bookId: string | number, quantity: number) => void;
  removeBook: (bookId: string | number) => void;
  clearBooks: (bookIds: (string | number)[]) => void;
}

const BookCartContext = createContext<BookCartContextValue | null>(null);

export function BookCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);

  const value = useMemo<BookCartContextValue>(() => {
    const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

    return {
      cart,
      totalQuantity,
      addBook: (book, quantity = 1) => {
        setCart((current) => {
          const existing = current.find((item) => String(item.book.id) === String(book.id));
          if (existing) {
            return current.map((item) =>
              String(item.book.id) === String(book.id)
                ? { ...item, quantity: item.quantity + quantity }
                : item,
            );
          }
          return [...current, { book, quantity }];
        });
      },
      removeBook: (bookId) => {
        setCart((current) => current.filter((item) => String(item.book.id) !== String(bookId)));
      },
      updateQuantity: (bookId, quantity) => {
        setCart((current) =>
          current.map((item) =>
            String(item.book.id) === String(bookId)
              ? { ...item, quantity: Math.max(1, quantity) }
              : item,
          ),
        );
      },
      clearBooks: (bookIds) => {
        const selectedIds = new Set(bookIds.map(String));
        setCart((current) => current.filter((item) => !selectedIds.has(String(item.book.id))));
      },
    };
  }, [cart]);

  return <BookCartContext.Provider value={value}>{children}</BookCartContext.Provider>;
}

export function useBookCart() {
  const context = useContext(BookCartContext);
  if (!context) {
    throw new Error("useBookCart must be used inside BookCartProvider");
  }
  return context;
}
