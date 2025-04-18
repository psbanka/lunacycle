import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTask } from "@/contexts/TaskContext";
import { useTheme } from "@/contexts/ThemeContext";
import Picker from "@emoji-mart/react";
import data from '@emoji-mart/data'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// Schema for template category creation
const templateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  emoji: z.string().optional(),
});

type TemplateCategoryFormValues = z.infer<typeof templateCategorySchema>;

interface AddTemplateCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTemplateCategoryDialog({
  open,
  onOpenChange,
}: AddTemplateCategoryDialogProps) {
  const { addTemplateCategory } = useTask();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const themeObject = useTheme();

  const form = useForm<TemplateCategoryFormValues>({
    resolver: zodResolver(templateCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      emoji: "",
    },
  });

  const onSubmit = async (values: TemplateCategoryFormValues) => {
    setIsSubmitting(true);

    try {
      addTemplateCategory({
        emoji: values.emoji || null,
        name: values.name,
        description: values.description || null,
      });

      // Reset form and close dialog
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to add category:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    form.setValue("emoji", emoji.native);
    setShowEmojiPicker(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] overflow-visible">
        <DialogHeader>
          <DialogTitle>Add new Category</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Category name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe this category..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emoji (optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Select an emoji"
                        value={field.value}
                        readOnly
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      >
                        {showEmojiPicker ? "Close" : "Pick Emoji"}
                      </Button>
                    </div>
                  </FormControl>
                  {showEmojiPicker && (
                    <div className="mt-2 relative" style={{ height: '300px' }}>
                      <div className="absolute inset-0 overflow-y-auto">
                        <Picker
                          data={data}
                          theme={themeObject.theme}
                          onEmojiSelect={handleEmojiSelect}
                          previewPosition="none"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
