"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, Lock, Unlock, Eye, EyeOff, Loader2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getFaviconUrl, isValidUrl } from "@/lib/sections/section-config";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z.string().min(1, "Título é obrigatório"),
  url: z.string().min(1, "URL é obrigatória").refine(isValidUrl, "URL inválida"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
  hasCredentials: z.boolean().default(false),
  username: z.string().optional(),
  password: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FormData & { id?: string }) => void;
  initialData?: { id: string; title: string; url: string; category: string; description?: string; username?: string; password?: string } | null;
  existingCategories: string[];
}

export function AddLinkModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingCategories,
}: AddLinkModalProps) {
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [previewFavicon, setPreviewFavicon] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      url: "",
      category: "",
      description: "",
      hasCredentials: false,
      username: "",
      password: "",
    },
  });

  const watchUrl = form.watch("url");
  const watchHasCredentials = form.watch("hasCredentials");

  useEffect(() => {
    if (initialData) {
      form.reset({
        title: initialData.title,
        url: initialData.url,
        category: initialData.category,
        description: initialData.description || "",
        hasCredentials: !!initialData.username,
        username: initialData.username || "",
        password: initialData.password || "",
      });
      setPreviewFavicon(getFaviconUrl(initialData.url));
    } else {
      form.reset({
        title: "",
        url: "",
        category: "",
        description: "",
        hasCredentials: false,
        username: "",
        password: "",
      });
      setPreviewFavicon(null);
    }
  }, [initialData, form, isOpen]);

  useEffect(() => {
    const fetchMetadata = async () => {
      if (!watchUrl || !isValidUrl(watchUrl)) return;
      
      setPreviewFavicon(getFaviconUrl(watchUrl));
      
      // Only fetch title if it's empty
      if (form.getValues("title")) return;

      setIsFetchingMetadata(true);
      try {
        const response = await fetch(`/api/metadata?url=${encodeURIComponent(watchUrl)}`);
        if (response.ok) {
          const data = await response.json();
          if (data.title && !form.getValues("title")) {
            form.setValue("title", data.title);
          }
        }
      } catch (error) {
        // Silently fail - user can enter title manually
      } finally {
        setIsFetchingMetadata(false);
      }
    };

    const timer = setTimeout(fetchMetadata, 1000);
    return () => clearTimeout(timer);
  }, [watchUrl, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit({
      ...data,
      id: initialData?.id,
    });
  };

  const handleClose = () => {
    form.reset();
    setPreviewFavicon(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Editar Link" : "Adicionar Link"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>URL</FormLabel>
                  <div className="flex items-center gap-2">
                    {previewFavicon && (
                      <img
                        src={previewFavicon}
                        alt=""
                        className="w-5 h-5"
                        onError={() => setPreviewFavicon(null)}
                      />
                    )}
                    <FormControl>
                      <Input
                        placeholder="https://..."
                        {...field}
                        className={cn(isFetchingMetadata && "pr-10")}
                      />
                    </FormControl>
                    {isFetchingMetadata && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-3" />
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do link" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <div className="space-y-2">
                    <FormControl>
                      <Input
                        placeholder="Ex: Produção, Staging, Documentação"
                        {...field}
                        list="categories"
                      />
                    </FormControl>
                    <datalist id="categories">
                      {existingCategories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                    {existingCategories.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {existingCategories.slice(0, 5).map((cat) => (
                          <Badge
                            key={cat}
                            variant="outline"
                            className="cursor-pointer hover:bg-muted"
                            onClick={() => form.setValue("category", cat)}
                          >
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Breve descrição do link"
                      {...field}
                      rows={2}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hasCredentials"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base flex items-center gap-2">
                      {field.value ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      Incluir credenciais
                    </FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Adicionar usuário e senha de acesso
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {watchHasCredentials && (
              <Alert variant="warning" className="bg-amber-50 border-amber-200">
                <AlertDescription className="text-amber-800 text-xs">
                  ⚠️ Aviso: Não recomendado para senhas críticas de produção.
                  Considere usar um gerenciador de senhas dedicado.
                </AlertDescription>
              </Alert>
            )}

            {watchHasCredentials && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••"
                            {...field}
                          />
                        </FormControl>
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">
                {initialData ? "Salvar" : "Adicionar Link"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
