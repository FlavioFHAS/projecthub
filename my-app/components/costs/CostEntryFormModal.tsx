"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CostType } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyInput } from "@/components/shared/CurrencyInput";
import { COST_TYPE_CONFIG } from "@/lib/costs/cost-utils";

const formSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.nativeEnum(CostType),
  amount: z.number().min(0.01, "Valor deve ser maior que zero"),
  quantity: z.number().min(1, "Quantidade deve ser pelo menos 1"),
  unitPrice: z.number().min(0),
  date: z.string().min(1, "Data é obrigatória"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CostEntryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  projectId: string;
}

export function CostEntryFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  projectId,
}: CostEntryFormModalProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      type: CostType.OTHER,
      amount: 0,
      quantity: 1,
      unitPrice: 0,
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    },
  });

  const watchQuantity = form.watch("quantity");
  const watchUnitPrice = form.watch("unitPrice");

  useEffect(() => {
    const total = (watchQuantity || 0) * (watchUnitPrice || 0);
    form.setValue("amount", total);
  }, [watchQuantity, watchUnitPrice, form]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        description: initialData.description,
        type: initialData.type,
        amount: initialData.amount,
        quantity: initialData.quantity,
        unitPrice: initialData.unitPrice || initialData.amount,
        date: format(new Date(initialData.date), "yyyy-MM-dd"),
        notes: initialData.notes || "",
      });
    } else {
      form.reset({
        description: "",
        type: CostType.OTHER,
        amount: 0,
        quantity: 1,
        unitPrice: 0,
        date: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      });
    }
  }, [initialData, form, isOpen]);

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...(initialData && { id: initialData.id }),
      description: data.description,
      type: data.type,
      amount: data.amount,
      quantity: data.quantity,
      unitPrice: data.unitPrice,
      date: new Date(data.date),
      notes: data.notes,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Custo" : "Novo Custo"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do custo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(COST_TYPE_CONFIG).map(([type, config]) => (
                        <SelectItem key={type} value={type}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unitPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Unitário</FormLabel>
                    <FormControl>
                      <CurrencyInput
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor Total</FormLabel>
                  <FormControl>
                    <CurrencyInput value={field.value} onChange={() => {}} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais (opcional)"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {initialData ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
