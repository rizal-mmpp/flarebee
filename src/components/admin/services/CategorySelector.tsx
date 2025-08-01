
'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, PlusCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getItemGroupsFromErpNext, createItemGroupInErpNext } from '@/lib/actions/erpnext/item-group.actions';
import { useCombinedAuth } from '@/lib/context/CombinedAuthContext';
import { cn } from '@/lib/utils';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  hasError?: boolean;
}

export function CategorySelector({ value, onChange, className, hasError = false }: CategorySelectorProps) {
  const { erpSid } = useCombinedAuth();
  const { toast } = useToast();

  const [itemGroups, setItemGroups] = useState<{ name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, startCreateTransition] = useTransition();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchItemGroups = useCallback(async () => {
    if (!erpSid) return;
    setIsLoading(true);
    const result = await getItemGroupsFromErpNext({ sid: erpSid });
    if (result.success && result.data) {
      // Filter out parent groups like "All Item Groups"
      const filteredGroups = result.data.filter(g => g.name.toLowerCase() !== 'all item groups');
      setItemGroups(filteredGroups);
    } else {
      toast({ title: "Error", description: result.error || "Could not fetch item groups.", variant: "destructive" });
    }
    setIsLoading(false);
  }, [erpSid, toast]);

  useEffect(() => {
    fetchItemGroups();
  }, [fetchItemGroups]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim() || !erpSid) return;
    setCreateError(null);
    startCreateTransition(async () => {
      const result = await createItemGroupInErpNext({ sid: erpSid, name: newCategoryName });
      if (result.success) {
        toast({ title: "Category Created", description: `"${newCategoryName}" has been added.` });
        setIsCreateDialogOpen(false);
        setNewCategoryName('');
        await fetchItemGroups(); // Refetch the list
        onChange(newCategoryName); // Select the new category
      } else {
        setCreateError(result.error || "Failed to create category.");
      }
    });
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select onValueChange={onChange} value={value || ''} disabled={isLoading}>
        <SelectTrigger id="categoryId" className={cn(hasError && "border-destructive")}>
          <SelectValue placeholder={isLoading ? "Loading categories..." : "Select category"} />
        </SelectTrigger>
        <SelectContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-2">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            itemGroups.map(group => (
              <SelectItem key={group.name} value={group.name}>{group.name}</SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="flex-shrink-0"
        onClick={() => setIsCreateDialogOpen(true)}
        aria-label="Create new category"
      >
        <PlusCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Category</DialogTitle>
            <DialogDescription>
              This will create a new Item Group in ERPNext.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="new-category-name">Category Name</Label>
            <Input
              id="new-category-name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="e.g., AI Solutions"
              className="mt-1"
            />
            {createError && (
              <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {createError}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} disabled={isCreating}>
              Cancel
            </Button>
            <Button onClick={handleCreateCategory} disabled={isCreating || !newCategoryName.trim()}>
              {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
