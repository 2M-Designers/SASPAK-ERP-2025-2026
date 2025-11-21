// ============================================
// ADVANCED CUSTOM HOOKS
// File: @/hooks/useMasterSetup.ts
// ============================================

import { useState, useEffect, useCallback } from "react";
import { MasterSetupService } from "@/services/master-setup.service";
import {
  MasterSetupConfig,
  FieldConfig,
  ApiPayload,
} from "@/types/master-setup.types";
import { useToast } from "@/hooks/use-toast";

export function useMasterSetup(config: MasterSetupConfig) {
  const service = new MasterSetupService();
  const { toast } = useToast();

  const [data, setData] = useState<any[]>([]);
  const [fieldConfig, setFieldConfig] = useState<FieldConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 50,
    total: 0,
  });

  // Load field configuration
  const loadConfig = useCallback(async () => {
    try {
      const fieldConfig = await service.getConfig(config.endpoint);
      setFieldConfig(fieldConfig);
    } catch (err) {
      setError("Failed to load configuration");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load field configuration",
      });
    }
  }, [config.endpoint]);

  // Load data with optional payload
  const loadData = useCallback(
    async (payload?: ApiPayload) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await service.getList(config.endpoint, payload);
        const transformedData = config.transformData
          ? config.transformData(result)
          : result;
        setData(transformedData);
        setPagination((prev) => ({ ...prev, total: transformedData.length }));
      } catch (err) {
        setError("Failed to load data");
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [config.endpoint, config.transformData]
  );

  // Create new record
  const createRecord = useCallback(
    async (recordData: any) => {
      setIsLoading(true);
      try {
        const result = await service.create(
          config.endpoint,
          recordData,
          config.enableImageUpload
        );
        setData((prev) => [...prev, result]);
        toast({
          title: "Success",
          description: `${config.title} created successfully`,
        });
        return result;
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create record",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [config.endpoint, config.enableImageUpload, config.title]
  );

  // Update existing record
  const updateRecord = useCallback(
    async (id: number, recordData: any) => {
      setIsLoading(true);
      try {
        const result = await service.update(
          config.endpoint,
          id,
          recordData,
          config.enableImageUpload
        );
        setData((prev) => prev.map((item) => (item.id === id ? result : item)));
        toast({
          title: "Success",
          description: `${config.title} updated successfully`,
        });
        return result;
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update record",
        });
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [config.endpoint, config.enableImageUpload, config.title]
  );

  // Delete record
  const deleteRecord = useCallback(
    async (id: number) => {
      setIsLoading(true);
      try {
        const success = await service.delete(config.endpoint, id);
        if (success) {
          setData((prev) => prev.filter((item) => item.id !== id));
          toast({
            title: "Success",
            description: `${config.title} deleted successfully`,
          });
        }
        return success;
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to delete record",
        });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [config.endpoint, config.title]
  );

  // Search/Filter data
  const searchData = useCallback(
    (searchTerm: string) => {
      if (!searchTerm) {
        loadData();
        return;
      }

      const filtered = data.filter((item) => {
        const searchField = config.searchField || "name";
        const value = item[searchField];
        return value
          ? value.toString().toLowerCase().includes(searchTerm.toLowerCase())
          : false;
      });
      setData(filtered);
    },
    [data, config.searchField, loadData]
  );

  // Initial load
  useEffect(() => {
    loadConfig();
    loadData();
  }, [loadConfig, loadData]);

  return {
    data,
    fieldConfig,
    isLoading,
    error,
    pagination,
    createRecord,
    updateRecord,
    deleteRecord,
    loadData,
    searchData,
    service,
  };
}
