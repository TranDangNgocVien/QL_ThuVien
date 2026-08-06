import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Plus, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input, Label, FieldError, Textarea } from "./ui/input";
import { Select } from "./ui/select";
import type { Book, BookCategory, BookInput } from "../types/book";

const categories: BookCategory[] = [
  "van-hoc",
  "khoa-hoc",
  "cong-nghe",
  "lich-su",
  "thieu-nhi",
  "khac",
];

const currentYear = new Date().getFullYear();

function buildSchema(t: (key: string) => string) {
  return z
    .object({
      title: z.string().min(1, t("form.errors.titleRequired")),
      author: z.string().min(1, t("form.errors.authorRequired")),
      category: z.enum(categories as [BookCategory, ...BookCategory[]]),
      publishedYear: z.coerce
        .number()
        .int()
        .min(1400, t("form.errors.yearInvalid"))
        .max(currentYear, t("form.errors.yearInvalid")),
      quantity: z.coerce.number().int().min(0, t("form.errors.quantityMin")),
      available: z.coerce.number().int().min(0, t("form.errors.quantityMin")),
      isbn: z.string().optional(),
      note: z.string().optional(),
      tags: z.array(z.object({ value: z.string().min(1) })).optional(),
    })
    .refine((data) => data.available <= data.quantity, {
      message: t("form.errors.availableMax"),
      path: ["available"],
    });
}

type FormSchema = ReturnType<typeof buildSchema>;
type FormValues = z.input<FormSchema>;
type FormOutput = z.output<FormSchema>;

interface BookFormProps {
  defaultValues?: Book | null;
  onSubmit: (input: BookInput) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function BookForm({
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: BookFormProps) {
  const { t } = useTranslation();
  const schema = buildSchema(t);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues
      ? {
          title: defaultValues.title,
          author: defaultValues.author,
          category: defaultValues.category,
          publishedYear: defaultValues.publishedYear,
          quantity: defaultValues.quantity,
          available: defaultValues.available,
          isbn: defaultValues.isbn ?? "",
          note: defaultValues.note ?? "",
          tags: (defaultValues.tags ?? []).map((value) => ({ value })),
        }
      : {
          title: "",
          author: "",
          category: "van-hoc",
          publishedYear: currentYear,
          quantity: 1,
          available: 1,
          isbn: "",
          note: "",
          tags: [],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "tags" });

  const submit = handleSubmit(async (values) => {
    await onSubmit({
      title: values.title,
      author: values.author,
      category: values.category,
      publishedYear: values.publishedYear,
      quantity: values.quantity,
      available: values.available,
      isbn: values.isbn || undefined,
      note: values.note || undefined,
      tags: (values.tags ?? [])
        .map((tag: { value: string }) => tag.value)
        .filter(Boolean),
    });
  });

  return (
    <form
      onSubmit={submit}
      className="space-y-4"
      onKeyDown={(e) => {
        // Cho phép submit nhanh bằng Enter, trừ khi đang ở trong textarea
        if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
          e.preventDefault();
          submit();
        }
      }}
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Label htmlFor="title">{t("form.titleLabel")}</Label>
          <Input id="title" {...register("title")} autoFocus />
          <FieldError>{errors.title?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="author">{t("form.authorLabel")}</Label>
          <Input id="author" {...register("author")} />
          <FieldError>{errors.author?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="category">{t("form.categoryLabel")}</Label>
          <Select id="category" {...register("category")}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {t(`category.${c}`)}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="publishedYear">{t("form.yearLabel")}</Label>
          <Input
            id="publishedYear"
            type="number"
            {...register("publishedYear")}
          />
          <FieldError>{errors.publishedYear?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="isbn">{t("form.isbnLabel")}</Label>
          <Input id="isbn" {...register("isbn")} />
        </div>

        <div>
          <Label htmlFor="quantity">{t("form.quantityLabel")}</Label>
          <Input id="quantity" type="number" {...register("quantity")} />
          <FieldError>{errors.quantity?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="available">{t("form.availableLabel")}</Label>
          <Input id="available" type="number" {...register("available")} />
          <FieldError>{errors.available?.message}</FieldError>
        </div>
      </div>

      <div>
        <Label>{t("form.tagsLabel")}</Label>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <Input
                {...register(`tags.${index}.value` as const)}
                placeholder={t("form.tagPlaceholder")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                aria-label="remove tag"
              >
                <X size={16} />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => append({ value: "" })}
          >
            <Plus size={14} /> {t("form.addTag")}
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="note">{t("form.noteLabel")}</Label>
        <Textarea id="note" rows={2} {...register("note")} />
      </div>

      <div className="flex justify-end gap-2 border-t border-paper-line pt-4">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("form.cancel")}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("form.saving") : t("form.save")}
        </Button>
      </div>
    </form>
  );
}
