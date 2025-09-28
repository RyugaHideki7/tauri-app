import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../components/layout/ThemeProvider";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Select from "../components/ui/Select";
import SearchableSelect from "../components/ui/SearchableSelect";
import DatePicker from "../components/ui/DatePicker";
import IntuitiveTimePicker from "../components/ui/IntuitiveTimePicker";
import Table from "../components/ui/Table";
import Dialog from "../components/ui/Dialog";
import ActionButtons from "../components/ui/ActionButtons";
import { useToast } from "../components/ui/Toast";
import * as ExcelJS from "exceljs";
import { ROLES, hasRole } from "../types/auth";

interface NonConformityReport {
  id: string;
  report_number: string;
  report_date: string;
  line_id: string;
  line_name?: string;
  product_id: string;
  format_id?: number;
  production_date: string;
  team: string;
  time: string;
  description_type: string;
  description_details: string;
  quantity: number;
  claim_origin: string;
  claim_origin_detail?: string;
  claim_origin_client_id?: string;
  claim_origin_manual?: string;
  valuation: string; // Decimal serializes as string from Rust
  performance?: string;
  picture_data?: string;
  status: string;
  reported_by: string;
  created_at: string;
  updated_at: string;
  product_name?: string;
  format_display?: string;
}

interface PaginatedResponse {
  data: NonConformityReport[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

interface Product {
  id: string;
  designation: string;
  code?: string;
}

interface Client {
  id: string;
  name: string;
}

interface ProductionLine {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

interface Format {
  id: number;
  format_index: number;
  format_unit: string;
}

type TableColumnDefinition = {
  key: string;
  header: React.ReactNode;
  width?: string;
  render?: (value: any, row: any) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string;
};

const COLUMN_ORDER: string[] = [
  "report_number",
  "report_date",
  "line_name",
  "product_name",
  "production_date",
  "format_display",
  "team",
  "time",
  "description_type",
  "quantity",
  "claim_origin",
  "claim_origin_detail",
  "description_details",
  "valuation",
  "performance",
  "actions",
];

const DEFAULT_VISIBLE_COLUMN_KEYS: string[] = [
  "report_date",
  "line_name",
  "product_name",
  "production_date",
  "format_display",
  "team",
  "time",
  "description_type",
  "quantity",
  "claim_origin",
  "claim_origin_detail",
  "description_details",
  "valuation",
  "performance",
  "actions",
];

const COLUMN_LABELS: Record<string, string> = {
  report_number: "N° de rapport",
  report_date: "Date de la réclamation",
  line_name: "Ligne",
  product_name: "Produit",
  production_date: "Date de production",
  format_display: "Format",
  team: "Équipe",
  time: "Heure",
  description_type: "Description de la NC",
  quantity: "Quantité",
  claim_origin: "Origine de la réclamation",
  claim_origin_detail: "Détail de la réclamation",
  description_details: "Détails complémentaires",
  valuation: "Valorisation",
  performance: "Performance",
  actions: "Actions",
};

const arraysEqual = (a: string[], b: string[]) => {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const isColumnAllowed = (
  key: string,
  canViewPerformance: boolean,
  canFullEdit: boolean
) => {
  if (key === "valuation" || key === "performance") {
    return canViewPerformance;
  }

  if (key === "actions") {
    return canFullEdit;
  }

  return true;
};

const sanitizeColumnKeys = (
  keys: string[],
  canViewPerformance: boolean,
  canFullEdit: boolean
) => {
  const uniqueKeys = Array.from(new Set(keys));
  return COLUMN_ORDER.filter(
    (key) => uniqueKeys.includes(key) && isColumnAllowed(key, canViewPerformance, canFullEdit)
  );
};

export const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { addToast } = useToast();
  const todayStr = new Date().toISOString().split("T")[0];
  const [reports, setReports] = useState<NonConformityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaimOrigin, setSelectedClaimOrigin] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [descriptionTypes, setDescriptionTypes] = useState<
    Array<{ name: string }>
  >([]);

  // Filter states
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [lines, setLines] = useState<ProductionLine[]>([]);
  const [selectedLine, setSelectedLine] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Edit modal states
  const [editingReport, setEditingReport] =
    useState<NonConformityReport | null>(null);

  // Full edit modal states
  const [fullEditModalOpen, setFullEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<
    Partial<NonConformityReport>
  >({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editLines, setEditLines] = useState<ProductionLine[]>([]);
  const [formats, setFormats] = useState<Format[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [editSelectedClient, setEditSelectedClient] = useState("");

  // Picture view modal states
  const [pictureViewModalOpen, setPictureViewModalOpen] = useState(false);
  const [viewingPicture, setViewingPicture] = useState<string | null>(null);

  const canViewPerformance =
    hasRole(user, ROLES.PERFORMANCE) || hasRole(user, ROLES.ADMIN);
  const canFullEdit =
    hasRole(user, ROLES.PERFORMANCE) || hasRole(user, ROLES.ADMIN);

  const storageKey = React.useMemo(
    () =>
      user
        ? `reports_visible_columns_${user.id}`
        : "reports_visible_columns_guest",
    [user]
  );

  const computedDefaultColumnKeys = React.useMemo(
    () => sanitizeColumnKeys(DEFAULT_VISIBLE_COLUMN_KEYS, canViewPerformance, canFullEdit),
    [canViewPerformance, canFullEdit]
  );

  const [visibleColumnKeys, setVisibleColumnKeys] = useState<string[]>(
    computedDefaultColumnKeys
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = window.localStorage.getItem(storageKey);
    let nextKeys = computedDefaultColumnKeys;

    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          nextKeys = sanitizeColumnKeys(parsed, canViewPerformance, canFullEdit);
        }
      } catch (error) {
        console.error("Failed to parse stored visible columns:", error);
      }
    }

    setVisibleColumnKeys((prev) =>
      arraysEqual(prev, nextKeys) ? prev : nextKeys
    );
  }, [storageKey, computedDefaultColumnKeys, canViewPerformance, canFullEdit]);

  useEffect(() => {
    if (!visibleColumnKeys.length) return;

    const sanitized = sanitizeColumnKeys(
      visibleColumnKeys,
      canViewPerformance,
      canFullEdit
    );
    const fallback = computedDefaultColumnKeys;
    const finalKeys = sanitized.length ? sanitized : fallback;

    if (!arraysEqual(visibleColumnKeys, finalKeys)) {
      setVisibleColumnKeys(finalKeys);
      return;
    }

    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, JSON.stringify(finalKeys));
    }
  }, [
    visibleColumnKeys,
    canViewPerformance,
    canFullEdit,
    storageKey,
    computedDefaultColumnKeys,
  ]);

  const availableColumnKeys = React.useMemo(
    () =>
      COLUMN_ORDER.filter((key) =>
        isColumnAllowed(key, canViewPerformance, canFullEdit)
      ),
    [canViewPerformance, canFullEdit]
  );

  const toggleColumnVisibility = React.useCallback(
    (key: string) => {
      if (!isColumnAllowed(key, canViewPerformance, canFullEdit)) {
        return;
      }

      setVisibleColumnKeys((prev) => {
        const exists = prev.includes(key);
        if (exists) {
          return prev.filter((item) => item !== key);
        }

        const nextSet = new Set([...prev, key]);
        return COLUMN_ORDER.filter((columnKey) => nextSet.has(columnKey));
      });
    },
    [canViewPerformance, canFullEdit]
  );

  const resetVisibleColumns = React.useCallback(() => {
    setVisibleColumnKeys(computedDefaultColumnKeys);
  }, [computedDefaultColumnKeys]);

  // Determine user's accessible claim origins based on their roles
  const getUserAccessibleClaimOrigins = () => {
    if (!user) return [];

    const accessibleOrigins = [];

    // Check each role and add corresponding claim origins
    if (hasRole(user, ROLES.SITE01)) {
      accessibleOrigins.push("site01");
    }
    if (hasRole(user, ROLES.SITE02)) {
      accessibleOrigins.push("site02");
    }
    if (hasRole(user, ROLES.RECLAMATION_CLIENT)) {
      accessibleOrigins.push("Réclamation client");
    }
    if (hasRole(user, ROLES.RETOUR_CLIENT)) {
      accessibleOrigins.push("Retour client");
    }
    if (hasRole(user, ROLES.CONSOMMATEUR)) {
      accessibleOrigins.push("consommateur");
    }

    // Admin and performance roles can see all origins
    if (hasRole(user, ROLES.ADMIN) || hasRole(user, ROLES.PERFORMANCE)) {
      return [
        "site01",
        "site02",
        "Réclamation client",
        "Retour client",
        "consommateur",
      ];
    }

    return accessibleOrigins;
  };

  const userAccessibleOrigins = getUserAccessibleClaimOrigins();
  const hasOnlyOneRole = userAccessibleOrigins.length === 1;
  const shouldPreselect = hasOnlyOneRole && !selectedClaimOrigin;

  // Debug user and accessible origins
  console.error("[Reports] ROLES constants:", ROLES);
  console.error("[Reports] User object:", user);
  console.error("[Reports] User roles array:", user?.roles);
  console.error("[Reports] User primary role:", user?.role);
  console.error("[Reports] User accessible origins:", userAccessibleOrigins);
  console.error("[Reports] Has only one role:", hasOnlyOneRole);
  console.error("[Reports] Should preselect:", shouldPreselect);
  console.error(
    "[Reports] hasRole(user, ROLES.ADMIN):",
    hasRole(user, ROLES.ADMIN)
  );
  console.error(
    "[Reports] hasRole(user, ROLES.PERFORMANCE):",
    hasRole(user, ROLES.PERFORMANCE)
  );
  console.error(
    "[Reports] hasRole(user, ROLES.SITE01):",
    hasRole(user, ROLES.SITE01)
  );
  console.error(
    "[Reports] hasRole(user, ROLES.SITE02):",
    hasRole(user, ROLES.SITE02)
  );

  useEffect(() => {
    // Debug current filters
    console.debug("[Reports] loadReports triggered with filters:", {
      page,
      itemsPerPage,
      selectedClaimOrigin: `"${selectedClaimOrigin}"`,
      selectedProduct: `"${selectedProduct}"`,
      selectedLine: `"${selectedLine}"`,
      startDate: `"${startDate}"`,
      endDate: `"${endDate}"`,
    });
    loadReports();
  }, [
    page,
    selectedClaimOrigin,
    selectedProduct,
    selectedLine,
    startDate,
    endDate,
    itemsPerPage,
  ]);

  // Auto-select claim origin if user has only one accessible role
  useEffect(() => {
    if (shouldPreselect && userAccessibleOrigins.length === 1) {
      setSelectedClaimOrigin(userAccessibleOrigins[0]);
    }
  }, [shouldPreselect, userAccessibleOrigins]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load products, lines, and edit data in parallel
        await Promise.all([
          loadProducts(),
          loadLines(),
          loadEditData(),
          // Load description types
          (async () => {
            try {
              const types = await invoke<Array<{ name: string }>>(
                "get_description_types"
              );
              setDescriptionTypes(types);
            } catch (error) {
              console.error("Failed to fetch description types:", error);
              addToast(
                "Impossible de charger les types de description",
                "error"
              );
            }
          })(),
        ]);
      } catch (error) {
        console.error("Error loading initial data:", error);
      }
    };

    loadInitialData();
  }, [addToast]);

  const loadEditData = async () => {
    try {
      const [linesData, formatsData, clientsData] = await Promise.all([
        invoke<ProductionLine[]>("get_lines"),
        invoke<Format[]>("get_formats"),
        invoke<Client[]>("get_clients"),
      ]);
      setEditLines(linesData);
      setFormats(formatsData);
      setClients(clientsData || []);
    } catch (error) {
      console.error("Failed to load edit data:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await invoke<Product[]>("get_products");
      setProducts(productsData);
    } catch (error) {
      console.error("Échec du chargement des produits :", error);
    }
  };

  const loadLines = async () => {
    try {
      const linesData = await invoke<ProductionLine[]>("get_lines");
      setLines(linesData);
    } catch (error) {
      console.error("Échec du chargement des lignes :", error);
    }
  };

  // Debug effect for filter state changes (post-setState values)
  useEffect(() => {
    console.debug("[Reports] Filter state changed ->", {
      selectedProduct,
      selectedLine,
      startDate,
      endDate,
      selectedClaimOrigin,
      page,
      itemsPerPage,
    });
  }, [
    selectedProduct,
    selectedLine,
    startDate,
    endDate,
    selectedClaimOrigin,
    page,
    itemsPerPage,
  ]);

  const loadReports = async () => {
    setLoading(true);
    try {
      console.debug("[Reports] Raw filter values:", {
        selectedClaimOrigin: `"${selectedClaimOrigin}"`,
        selectedClaimOriginLength: selectedClaimOrigin.length,
        selectedClaimOriginTruthy: !!selectedClaimOrigin,
        selectedProduct: `"${selectedProduct}"`,
        selectedLine: `"${selectedLine}"`,
        startDate: `"${startDate}"`,
        endDate: `"${endDate}"`,
      });

      // Determine the claim origin filter to apply
      let claimOriginFilter = selectedClaimOrigin || null;

      // For non-admin/performance users, always apply role-based filtering
      // When selectedClaimOrigin is empty ("Toutes les origines"), show all accessible origins
      // When selectedClaimOrigin has a value, show only that specific origin (if user has access)
      if (!hasRole(user, ROLES.ADMIN) && !hasRole(user, ROLES.PERFORMANCE)) {
        if (!selectedClaimOrigin) {
          // "Toutes les origines" selected - filter by all accessible origins
          claimOriginFilter = null; // Let backend handle filtering by user_accessible_origins
        } else {
          // Specific origin selected - verify user has access to it
          if (userAccessibleOrigins.includes(selectedClaimOrigin)) {
            claimOriginFilter = selectedClaimOrigin;
          } else {
            // User doesn't have access to selected origin, fallback to accessible origins
            claimOriginFilter = null;
          }
        }
      }

      const userAccessibleOriginsToSend =
        !hasRole(user, ROLES.ADMIN) && !hasRole(user, ROLES.PERFORMANCE)
          ? userAccessibleOrigins
          : null;

      const payload = {
        page,
        limit: itemsPerPage,
        claim_origin: claimOriginFilter,
        claimOrigin: claimOriginFilter, // Add camelCase version for consistency
        user_accessible_origins: userAccessibleOriginsToSend,
        userAccessibleOrigins: userAccessibleOriginsToSend, // Try camelCase version
        // Send both casings to diagnose mapping behavior
        product_id: selectedProduct || null,
        productId: selectedProduct || null,
        line_id: selectedLine || null,
        lineId: selectedLine || null,
        start_date: startDate || null,
        startDate: startDate || null,
        end_date: endDate || null,
        endDate: endDate || null,
      };
      console.debug(
        "[Reports] Final payload being sent:",
        JSON.stringify(payload, null, 2)
      );
      const response = await invoke<PaginatedResponse>(
        "get_reports_paginated",
        payload
      );

      setReports(response.data);
      setTotalPages(response.total_pages);
      setTotal(response.total);
    } catch (error) {
      console.error("Échec du chargement des rapports :", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setPage(1); // Reset to first page when filtering
  };

  const clearFilters = () => {
    setSelectedProduct("");
    setSelectedLine("");
    setStartDate("");
    setEndDate("");

    // Only clear claim origin if user has multiple roles
    // If user has only one role, keep it preselected
    if (!hasOnlyOneRole) {
      setSelectedClaimOrigin("");
    }

    setPage(1);
  };

  const exportToExcel = async () => {
    try {
      // Determine the claim origin filter for export (same logic as loadReports)
      let exportClaimOriginFilter = selectedClaimOrigin || null;

      // For non-admin/performance users, always apply role-based filtering
      if (!hasRole(user, ROLES.ADMIN) && !hasRole(user, ROLES.PERFORMANCE)) {
        if (!selectedClaimOrigin) {
          // "Toutes les origines" selected - filter by all accessible origins
          exportClaimOriginFilter = null; // Let backend handle filtering by user_accessible_origins
        } else {
          // Specific origin selected - verify user has access to it
          if (userAccessibleOrigins.includes(selectedClaimOrigin)) {
            exportClaimOriginFilter = selectedClaimOrigin;
          } else {
            // User doesn't have access to selected origin, fallback to accessible origins
            exportClaimOriginFilter = null;
          }
        }
      }

      // Fetch ALL filtered reports for export (not just current page)
      const exportPayload = {
        page: 1,
        limit: 999999, // Large number to get all results
        claim_origin: exportClaimOriginFilter,
        claimOrigin: exportClaimOriginFilter, // Add camelCase version for consistency
        user_accessible_origins:
          !hasRole(user, ROLES.ADMIN) && !hasRole(user, ROLES.PERFORMANCE)
            ? userAccessibleOrigins
            : null,
        product_id: selectedProduct || null,
        productId: selectedProduct || null,
        line_id: selectedLine || null,
        lineId: selectedLine || null,
        start_date: startDate || null,
        startDate: startDate || null,
        end_date: endDate || null,
        endDate: endDate || null,
      };

      console.debug(
        "[Export] Fetching all filtered reports with payload:",
        exportPayload
      );
      const exportResponse = await invoke<PaginatedResponse>(
        "get_reports_paginated",
        exportPayload
      );
      const allFilteredReports = exportResponse.data;

      console.debug(
        `[Export] Retrieved ${allFilteredReports.length} reports for export`
      );

      if (allFilteredReports.length === 0) {
        addToast(
          "Aucun rapport à exporter avec les filtres actuels",
          "warning"
        );
        return;
      }

      // Create a new workbook using ExcelJS
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Rapports");

      // Define column headers
      const headers = [
        "N° de rapport",
        "Date de la réclamation",
        "Ligne",
        "Produit",
        "Date de production",
        "Format",
        "Équipe",
        "Heure",
        "Description de la NC",
        "Quantité",
        "Origine de la réclamation",
        "Détail de la réclamation",
        "Détails complémentaires",
        ...(canViewPerformance ? ["Valorisation", "Performance"] : []),
      ];

      // Add headers to the worksheet
      worksheet.addRow(headers);

      // Style the header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "000000" }, size: 11 };
      headerRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "D9EAD3" },
      };
      headerRow.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      headerRow.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      headerRow.height = 25;

      // Style data rows
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber > 1) {
          // Skip header row
          row.alignment = {
            vertical: "middle",
            wrapText: true,
          };

          // Right align numeric columns
          [9, 13].forEach((colIndex) => {
            // Quantity and Valuation columns
            const cell = row.getCell(colIndex);
            cell.alignment = cell.alignment || {};
            cell.alignment.horizontal = "right";
          });

          // Center align team and time columns
          [6, 7].forEach((colIndex) => {
            const cell = row.getCell(colIndex);
            cell.alignment = cell.alignment || {};
            cell.alignment.horizontal = "center";
          });
        }
      });

      // Add data rows using ALL filtered reports
      allFilteredReports.forEach((report) => {
        const originMap: Record<string, string> = {
          site01: "Site 01",
          site02: "Site 02",
          "Réclamation client": "Réclamation client",
          "Retour client": "Retour client",
          consommateur: "Consommateur",
        };

        const originDetail = () => {
          if (["site01", "site02"].includes(report.claim_origin)) {
            return report.claim_origin === "site01" ? "Site 01" : "Site 02";
          }
          if (
            ["Réclamation client", "Retour client"].includes(
              report.claim_origin
            )
          ) {
            return report.claim_origin_detail || "-";
          }
          if (report.claim_origin === "consommateur") {
            return report.claim_origin_detail || "-";
          }
          return "-";
        };

        const rowData = [
          report.report_number,
          new Date(report.report_date), // Export as Date object for proper filtering
          report.line_name || "Ligne inconnue",
          report.product_name || "Produit inconnu",
          new Date(report.production_date), // Export as Date object for proper filtering
          report.format_display || "-",
          `Équipe ${report.team}`,
          report.time || "-",
          report.description_type,
          report.quantity,
          originMap[report.claim_origin] || report.claim_origin || "-",
          originDetail(),
          report.description_details || "-",
        ];

        if (canViewPerformance) {
          rowData.push(
            `${parseFloat(report.valuation)
              .toFixed(2)
              .replace(".", ",")} DZD`
          );
          rowData.push(report.performance || "-");
        }

        worksheet.addRow(rowData);
      });

      // Set column widths
      const columnWidths = [
        15, 18, 15, 25, 15, 12, 10, 8, 20, 10, 20, 20, 30,
      ];
      if (canViewPerformance) {
        columnWidths.push(15, 15);
      }

      worksheet.columns.forEach((column, index) => {
        if (columnWidths[index]) {
          column.width = columnWidths[index];
        }
      });

      // Generate clean, natural filename with actual filter values
      const today = new Date().toISOString().split("T")[0];
      let filename = "Rapports";

      // Add date range if filtered
      if (startDate && endDate) {
        filename += ` ${startDate} au ${endDate}`;
      } else if (startDate) {
        filename += ` depuis ${startDate}`;
      } else if (endDate) {
        filename += ` jusqu ${endDate}`;
      } else {
        filename += ` ${today}`;
      }

      // Add line name if filtered
      if (selectedLine) {
        const selectedLineObj = lines.find((l) => l.id === selectedLine);
        const lineName = selectedLineObj
          ? selectedLineObj.name
          : "Ligne inconnue";
        filename += ` -${lineName}`;
      }

      // Add product name if filtered
      if (selectedProduct) {
        const selectedProductObj = products.find(
          (p) => p.id === selectedProduct
        );
        if (selectedProductObj) {
          const productName = selectedProductObj.code
            ? `${selectedProductObj.designation} ${selectedProductObj.code}`
            : selectedProductObj.designation;
          filename += ` - ${productName}`;
        }
      }

      // Add claim origin if filtered
      if (selectedClaimOrigin) {
        const originMap: Record<string, string> = {
          site01: "Site 01",
          site02: "Site 02",
          "Réclamation client": "Réclamation client",
          "Retour client": "Retour client",
          consommateur: "Consommateur",
        };
        const originName =
          originMap[selectedClaimOrigin] || selectedClaimOrigin;
        filename += ` - ${originName}`;
      }

      // Clean filename and add extension
      const cleanFilename = filename.replace(/[<>:"/\\|?*]/g, "-") + ".xlsx";

      // Write the file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = cleanFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast(
        `Export réussi: ${allFilteredReports.length} rapports exportés`,
        "success"
      );
    } catch (error) {
      console.error("Erreur lors de l'export Excel:", error);
      addToast("Erreur lors de l'export Excel", "error");
    }
  };

  const handleFullEdit = (report: NonConformityReport) => {
    setEditingReport(report);
    // Ensure site origins have a visible, immutable detail value
    const isSite = ["site01", "site02"].includes(report.claim_origin);
    const ensuredDetail = isSite
      ? report.claim_origin === "site01"
        ? "Site 01"
        : "Site 02"
      : report.claim_origin_detail || "";

    setEditFormData({
      ...report,
      production_date: report.production_date.split("T")[0],
      report_date: report.report_date.split("T")[0],
      claim_origin_detail: ensuredDetail,
    });
    // Default-select original client for client-origin reports
    if (["Réclamation client", "Retour client"].includes(report.claim_origin)) {
      const fallbackId = (() => {
        if (report.claim_origin_client_id) return report.claim_origin_client_id;
        const match = clients.find(
          (c) => c.name === (report.claim_origin_detail || "")
        );
        return match ? match.id : "";
      })();
      setEditSelectedClient(fallbackId);
      // Also ensure formData has the id so it submits even if user doesn't touch the field
      setEditFormData((prev) => ({
        ...prev,
        claim_origin_client_id: fallbackId || undefined,
      }));
    } else {
      setEditSelectedClient("");
    }
    setEditErrors({});
    setFullEditModalOpen(true);
  };

  // If clients load after opening the modal, backfill selection from name when needed
  useEffect(() => {
    if (!fullEditModalOpen) return;
    if (!editingReport) return;
    const origin = editFormData.claim_origin || editingReport.claim_origin;
    if (!["Réclamation client", "Retour client"].includes(origin)) return;
    if (editSelectedClient) return; // already set
    const name = (
      editFormData.claim_origin_detail ||
      editingReport.claim_origin_detail ||
      ""
    ).trim();
    if (!name) return;
    const match = clients.find((c) => c.name === name);
    if (match) {
      setEditSelectedClient(match.id);
      setEditFormData((prev) => ({
        ...prev,
        claim_origin_client_id: match.id,
      }));
    }
  }, [clients, fullEditModalOpen]);

  const handleEditInputChange = (field: string, value: any) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (editErrors[field]) {
      setEditErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const validateEditForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!editFormData.line_id)
      newErrors.line_id = "La ligne de production est requise";
    if (!editFormData.product_id)
      newErrors.product_id = "Le produit est requis";
    if (!editFormData.format_id) newErrors.format_id = "Le format est requis";
    if (!editFormData.report_date)
      newErrors.report_date = "La date de la réclamation est requise";
    if (!editFormData.production_date)
      newErrors.production_date = "La date de production est requise";
    if (!editFormData.team) newErrors.team = "L'équipe est requise";
    if (!editFormData.time) newErrors.time = "L'heure est requise";
    if (!editFormData.description_type)
      newErrors.description_type = "Le type de description est requis";
    // "Détail de la réclamation" must be provided for all origins (including site origins)
    // For site origins, the detail should be auto-filled, but still validate it exists
    if (
      !editFormData.claim_origin_detail ||
      !editFormData.claim_origin_detail.trim()
    ) {
      newErrors.claim_origin_detail = "Le détail de la réclamation est requis";
    }
    if (!editFormData.quantity || editFormData.quantity <= 0)
      newErrors.quantity = "La quantité doit être supérieure à 0";
    if (
      editFormData.valuation === undefined ||
      (typeof editFormData.valuation === "number" && editFormData.valuation < 0)
    )
      newErrors.valuation = "La valorisation ne peut pas être négative";

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleViewPicture = (pictureData: string) => {
    setViewingPicture(pictureData);
    setPictureViewModalOpen(true);
  };

  // Delete a report
  const handleDeleteReport = async (report: NonConformityReport) => {
    try {
      // Send both snake_case and camelCase to satisfy any mapping
      await invoke<boolean>("delete_report", {
        report_id: report.id,
        reportId: report.id,
      });
      await loadReports();
      addToast("Rapport supprimé avec succès", "success");
    } catch (error) {
      console.error("Échec de la suppression du rapport :", error);
      addToast("Échec de la suppression du rapport", "error");
    }
  };

  const handleSaveFullEdit = async () => {
    if (!editingReport || !validateEditForm()) return;

    setLoading(true);
    try {
      await invoke("update_report", {
        report_id: editingReport.id,
        // Also send camelCase variant to be compatible with different backend expectations
        reportId: editingReport.id,
        request: {
          line_id: editFormData.line_id,
          product_id: editFormData.product_id,
          format_id: editFormData.format_id
            ? parseInt(editFormData.format_id.toString(), 10)
            : null,
          report_date: editFormData.report_date,
          production_date: editFormData.production_date,
          team: editFormData.team,
          time: (editFormData.time || "").trim().slice(0, 5),
          description_type: editFormData.description_type,
          description_details: editFormData.description_details,
          // Ensure site origins persist a consistent detail label and never send null
          claim_origin_detail: (() => {
            const origin = editFormData.claim_origin || "";
            if (origin === "site01") return "Site 01";
            if (origin === "site02") return "Site 02";
            // For other origins, ensure we always have a value
            return editFormData.claim_origin_detail &&
              editFormData.claim_origin_detail.trim() !== ""
              ? editFormData.claim_origin_detail.trim()
              : "";
          })(),
          claim_origin_client_id: editFormData.claim_origin_client_id || null,
          quantity: parseInt(editFormData.quantity?.toString() || "0", 10),
          claim_origin: editFormData.claim_origin,
          valuation:
            typeof editFormData.valuation === "string"
              ? parseFloat(editFormData.valuation)
              : editFormData.valuation,
          performance: editFormData.performance,
          // Preserve existing picture_data - don't overwrite with null
          picture_data: editingReport.picture_data,
        },
      });

      // Reload reports to get updated data
      await loadReports();

      setFullEditModalOpen(false);
      setEditingReport(null);
      setEditFormData({});
      addToast("Rapport mis à jour avec succès", "success");
    } catch (error) {
      console.error("Échec de la mise à jour du rapport :", error);
      addToast("Échec de la mise à jour du rapport", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const columnDefinitions: Record<string, TableColumnDefinition> = React.useMemo(
    () => ({
      report_number: {
        key: "report_number",
        header: COLUMN_LABELS.report_number,
        render: (value: string) => value || "-",
      },
      report_date: {
        key: "report_date",
        header: COLUMN_LABELS.report_date,
        render: (value: string) => formatDate(value),
      },
      line_name: {
        key: "line_name",
        header: COLUMN_LABELS.line_name,
        render: (value: string) => value || "Ligne inconnue",
        cellClassName: "max-w-[14rem]",
      },
      product_name: {
        key: "product_name",
        header: COLUMN_LABELS.product_name,
        render: (value: string) => value || "Produit inconnu",
        cellClassName: "max-w-[16rem]",
      },
      production_date: {
        key: "production_date",
        header: COLUMN_LABELS.production_date,
        render: (value: string) => formatDate(value),
      },
      format_display: {
        key: "format_display",
        header: COLUMN_LABELS.format_display,
        render: (value: string) => value || "-",
      },
      team: {
        key: "team",
        header: COLUMN_LABELS.team,
        render: (value: string) => `Équipe ${value}`,
      },
      time: {
        key: "time",
        header: COLUMN_LABELS.time,
        render: (value: string) => value || "-",
      },
      description_type: {
        key: "description_type",
        header: COLUMN_LABELS.description_type,
        cellClassName: "max-w-[16rem]",
      },
      quantity: {
        key: "quantity",
        header: COLUMN_LABELS.quantity,
      },
      claim_origin: {
        key: "claim_origin",
        header: COLUMN_LABELS.claim_origin,
        render: (value: string) => {
          const originMap: Record<string, string> = {
            site01: "Site 01",
            site02: "Site 02",
            "Réclamation client": "Réclamation client",
            "Retour client": "Retour client",
            consommateur: "Consommateur",
          };
          return originMap[value] || value || "-";
        },
        cellClassName: "max-w-[14rem]",
      },
      claim_origin_detail: {
        key: "claim_origin_detail",
        header: COLUMN_LABELS.claim_origin_detail,
        render: (value: string, row: NonConformityReport) => {
          if (["site01", "site02"].includes(row.claim_origin)) {
            return row.claim_origin === "site01" ? "Site 01" : "Site 02";
          }
          if (["Réclamation client", "Retour client"].includes(row.claim_origin)) {
            return value || "-";
          }
          if (row.claim_origin === "consommateur") {
            return value || "-";
          }
          return "-";
        },
        cellClassName: "max-w-[20rem]",
      },
      description_details: {
        key: "description_details",
        header: COLUMN_LABELS.description_details,
        render: (value: string) => (
          <div className="block whitespace-normal break-words max-w-[28rem]">
            {value || "-"}
          </div>
        ),
        cellClassName: "max-w-[28rem]",
      },
      valuation: {
        key: "valuation",
        header: COLUMN_LABELS.valuation,
        render: (value: string) => {
          if (!value) return "-";
          const numeric = Number.parseFloat(value);
          if (Number.isNaN(numeric)) return value;
          return `${numeric.toFixed(2)} DZD`;
        },
      },
      performance: {
        key: "performance",
        header: COLUMN_LABELS.performance,
        render: (value: string) => (
          <div className="flex items-center gap-2">
            <div className="block whitespace-normal break-words max-w-[24rem]">
              {value || "-"}
            </div>
          </div>
        ),
        cellClassName: "max-w-[24rem]",
      },
      actions: {
        key: "actions",
        header: COLUMN_LABELS.actions,
        render: (_value: unknown, row: NonConformityReport) => (
          <ActionButtons
            onEdit={() => handleFullEdit(row)}
            onShowImage={
              row.picture_data ? () => handleViewPicture(row.picture_data!) : undefined
            }
            onDelete={() => handleDeleteReport(row)}
            size="sm"
            variant="default"
            showImageButton={!!row.picture_data}
            theme={isDarkMode ? "dark" : "light"}
            deleteConfirmation={{
              title: "Confirmer la suppression",
              message: `Êtes-vous sûr de vouloir supprimer le rapport #${row.report_number} ? Cette action est irréversible.`,
            }}
          />
        ),
      },
    }),
    [
      handleFullEdit,
      handleViewPicture,
      handleDeleteReport,
      isDarkMode,
      formatDate,
    ]
  );

  const tableColumns = React.useMemo(() => {
    const columns: TableColumnDefinition[] = [];

    visibleColumnKeys.forEach((key) => {
      const definition = columnDefinitions[key];
      if (definition) {
        columns.push(definition);
      }
    });

    return columns;
  }, [visibleColumnKeys, columnDefinitions]);

  // ============================================
  // KEPT FOR REFERENCE - NOT CURRENTLY USED
  // Status color mapping function for report status indicators
  // Uncomment if status column is re-added to the table
  // ============================================
  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'open':
  //       return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
  //     case 'in_progress':
  //       return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
  //     case 'resolved':
  //       return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
  //     case 'closed':
  //       return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
  //     default:
  //       return 'bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-400';
  //   }
  // };

  return (
    <div className="p-4 lg:p-6 w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold text-foreground">
          Rapports de non-conformité
        </h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={exportToExcel}
            variant="outline"
            className="w-full sm:w-auto"
          >
            Exporter vers Excel
          </Button>
          <Button
            onClick={() => navigate("/reports/new")}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            Nouveau rapport
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="relative">
            <Select
              label="Filtrer par origine"
              value={selectedClaimOrigin}
              onChange={(value) => {
                console.debug(
                  "[Reports] claim_origin selected:",
                  value,
                  "type:",
                  typeof value
                );
                setSelectedClaimOrigin(value);
                // Note: selectedClaimOrigin will still show old value here due to React state timing
                console.debug(
                  "[Reports] selectedClaimOrigin will be updated to:",
                  value
                );
                handleFilterChange();
              }}
              disabled={hasOnlyOneRole}
              options={(() => {
                // Create origin label mapping
                const originLabels: Record<string, string> = {
                  site01: "Site 01",
                  site02: "Site 02",
                  "Réclamation client": "Réclamation client",
                  "Retour client": "Retour client",
                  consommateur: "Consommateur",
                };

                // If user has only one role, show only that option
                if (hasOnlyOneRole) {
                  const singleOrigin = userAccessibleOrigins[0];
                  return [
                    {
                      value: singleOrigin,
                      label: originLabels[singleOrigin] || singleOrigin,
                    },
                  ];
                }

                // For multiple roles or admin/performance, show accessible origins
                const baseOptions = [
                  { value: "", label: "Toutes les origines" },
                ];

                if (
                  hasRole(user, ROLES.ADMIN) ||
                  hasRole(user, ROLES.PERFORMANCE)
                ) {
                  // Admin and performance can see all origins
                  return [
                    ...baseOptions,
                    { value: "site01", label: "Site 01" },
                    { value: "site02", label: "Site 02" },
                    {
                      value: "Réclamation client",
                      label: "Réclamation client",
                    },
                    { value: "Retour client", label: "Retour client" },
                    { value: "consommateur", label: "Consommateur" },
                  ];
                }

                // For users with multiple roles, show only their accessible origins
                const accessibleOptions = userAccessibleOrigins.map(
                  (origin) => ({
                    value: origin,
                    label: originLabels[origin] || origin,
                  })
                );

                return [...baseOptions, ...accessibleOptions];
              })()}
            />
            {hasOnlyOneRole && (
              <div className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
                Filtré automatiquement selon votre rôle
              </div>
            )}
          </div>
          <SearchableSelect
            label="Filtrer par produit"
            value={selectedProduct}
            onChange={(value) => {
              console.debug(
                "[Reports] product selected:",
                value,
                "type:",
                typeof value
              );
              setSelectedProduct(value);
              console.debug(
                "[Reports] selectedProduct state after set:",
                selectedProduct
              );
              handleFilterChange();
            }}
            options={[
              { value: "", label: "Tous les produits" },
              ...products.map((product) => ({
                value: product.id,
                label: product.code
                  ? `${product.designation} (${product.code})`
                  : product.designation,
              })),
            ]}
            searchPlaceholder="Rechercher un produit..."
          />
          <SearchableSelect
            label="Filtrer par ligne"
            value={selectedLine}
            onChange={(value) => {
              console.debug(
                "[Reports] line selected:",
                value,
                "type:",
                typeof value
              );
              setSelectedLine(value);
              console.debug(
                "[Reports] selectedLine state after set:",
                selectedLine
              );
              handleFilterChange();
            }}
            options={[
              { value: "", label: "Toutes les lignes" },
              ...lines.map((line) => ({
                value: line.id,
                label: line.name,
              })),
            ]}
            searchPlaceholder="Rechercher une ligne..."
          />
          <DatePicker
            label="Date de début"
            value={startDate}
            onChange={(value) => {
              console.debug(
                "[Reports] start date selected:",
                value,
                "type:",
                typeof value
              );
              const hasEnd = !!endDate;
              if (hasEnd && value && value > endDate) {
                // Keep the selected start date; adjust end date to match
                addToast(
                  "Date de fin ajustée pour maintenir une plage valide.",
                  "warning",
                  3000
                );
                setStartDate(value);
                setEndDate(value);
              } else {
                setStartDate(value);
              }
              console.debug("[Reports] startDate state after set:", startDate);
              handleFilterChange();
            }}
            placeholder="Sélectionner une date de début"
            maxDate={endDate && endDate < todayStr ? endDate : todayStr}
          />
          <DatePicker
            label="Date de fin"
            value={endDate}
            onChange={(value) => {
              console.debug(
                "[Reports] end date selected:",
                value,
                "type:",
                typeof value
              );
              const hasStart = !!startDate;
              if (hasStart && value && value < startDate) {
                // Keep the selected end date; adjust start date to match
                addToast(
                  "Date de début ajustée pour maintenir une plage valide.",
                  "warning",
                  3000
                );
                setStartDate(value);
                setEndDate(value);
              } else {
                setEndDate(value);
              }
              console.debug("[Reports] endDate state after set:", endDate);
              handleFilterChange();
            }}
            placeholder="Sélectionner une date de fin"
            minDate={startDate || undefined}
            maxDate={todayStr}
          />
        </div>
        <div className="flex justify-end">
          <Button onClick={clearFilters} variant="outline" size="sm">
            Réinitialiser les filtres
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="border border-border rounded-2xl bg-surface/70 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground/90">
              Colonnes affichées
            </h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs"
              onClick={resetVisibleColumns}
            >
              Réinitialiser
            </Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {availableColumnKeys.map((key) => {
              const isSelected = visibleColumnKeys.includes(key);
              const label = COLUMN_LABELS[key] || key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleColumnVisibility(key)}
                  aria-pressed={isSelected}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-background text-muted-foreground border-border hover:border-primary/60 hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Sélectionnez les colonnes à afficher. Vos préférences seront conservées pour vos prochaines visites.
          </p>
        </div>
      </div>

      {/* Reports Table */}
      {reports.length === 0 && !loading ? (
        <div className="text-center py-16 border border-border rounded-lg bg-background">
          <div className="text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="text-lg font-medium">Aucun rapport trouvé</p>
            <p className="text-sm">
              {selectedProduct ||
              selectedLine ||
              startDate ||
              endDate ||
              selectedClaimOrigin
                ? "Essayez d'ajuster vos filtres"
                : "Aucun rapport n'a été créé pour le moment"}
            </p>
          </div>
        </div>
      ) : (
        <Table
          columns={tableColumns}
          data={loading ? [] : reports}
          pagination={{
            currentPage: page,
            totalPages,
            totalItems: total,
            itemsPerPage: itemsPerPage,
            onPageChange: setPage,
            onItemsPerPageChange: setItemsPerPage,
            showItemsPerPage: true,
          }}
        />
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="text-muted-foreground">
            <p className="text-sm font-medium">Chargement des rapports...</p>
          </div>
        </div>
      )}

      {/* Full Edit Modal */}
      <Dialog
        isOpen={fullEditModalOpen}
        onClose={() => setFullEditModalOpen(false)}
        title="Modifier le rapport complet"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          <div className="bg-muted/30 p-4 rounded-lg border border-border/50 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-foreground">
                Modification du rapport : {editingReport?.report_number}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Vous pouvez modifier tous les champs de ce rapport. Les
              modifications seront sauvegardées immédiatement.
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Line */}
            <div>
              <Select
                label="Ligne de production *"
                value={editFormData.line_id || ""}
                onChange={(value) => handleEditInputChange("line_id", value)}
                options={[
                  { value: "", label: "Sélectionnez une ligne" },
                  ...editLines.map((line) => ({
                    value: line.id,
                    label: line.name,
                  })),
                ]}
                error={editErrors.line_id}
              />
            </div>

            {/* Product */}
            <div>
              <Select
                label="Produit *"
                value={editFormData.product_id || ""}
                onChange={(value) => handleEditInputChange("product_id", value)}
                options={[
                  { value: "", label: "Sélectionnez un produit" },
                  ...products.map((product) => ({
                    value: product.id,
                    label: product.code
                      ? `${product.designation} (${product.code})`
                      : product.designation,
                  })),
                ]}
                error={editErrors.product_id}
              />
            </div>

            {/* Format */}
            <div>
              <Select
                label="Format *"
                value={editFormData.format_id?.toString() || ""}
                onChange={(value) =>
                  handleEditInputChange(
                    "format_id",
                    value ? parseInt(value) : undefined
                  )
                }
                options={[
                  { value: "", label: "Sélectionnez un format" },
                  ...formats.map((format) => ({
                    value: format.id.toString(),
                    label: `${format.format_index} ${format.format_unit}`,
                  })),
                ]}
                error={editErrors.format_id}
              />
            </div>

            {/* Report Date */}
            <div>
              <DatePicker
                label="Date de la réclamation *"
                value={editFormData.report_date || ""}
                onChange={(value) =>
                  handleEditInputChange("report_date", value)
                }
                error={editErrors.report_date}
                maxDate={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Production Date */}
            <div>
              <DatePicker
                label="Date de production *"
                value={editFormData.production_date || ""}
                onChange={(value) =>
                  handleEditInputChange("production_date", value)
                }
                error={editErrors.production_date}
                maxDate={new Date().toISOString().split("T")[0]}
              />
            </div>

            {/* Team */}
            <div>
              <Select
                label="Équipe *"
                value={editFormData.team || ""}
                onChange={(value) => handleEditInputChange("team", value)}
                options={[
                  { value: "", label: "Sélectionnez une équipe" },
                  { value: "A", label: "Équipe A" },
                  { value: "B", label: "Équipe B" },
                  { value: "C", label: "Équipe C" },
                ]}
                error={editErrors.team}
              />
            </div>

            {/* Time */}
            <div>
              <IntuitiveTimePicker
                label="Heure *"
                value={editFormData.time || ""}
                onChange={(value) => handleEditInputChange("time", value)}
                error={editErrors.time}
                format="24"
              />
            </div>

            {/* Description Type */}
            <div>
              <Select
                label="Description de la NC *"
                value={editFormData.description_type || ""}
                onChange={(value) =>
                  handleEditInputChange("description_type", value)
                }
                options={[
                  { value: "", label: "Sélectionnez une description" },
                  ...descriptionTypes.map((type) => ({
                    value: type.name,
                    label: type.name,
                  })),
                ]}
                error={editErrors.description_type}
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quantité *
              </label>
              <Input
                type="number"
                min="1"
                value={editFormData.quantity?.toString() || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleEditInputChange(
                    "quantity",
                    parseInt(e.target.value) || 0
                  )
                }
                error={editErrors.quantity}
              />
            </div>

            {/* Claim Origin */}
            <div>
              <Select
                label="Origine de la réclamation *"
                value={editFormData.claim_origin || ""}
                onChange={(value) =>
                  handleEditInputChange("claim_origin", value)
                }
                options={[
                  {
                    value: ROLES.RECLAMATION_CLIENT,
                    label: ROLES.RECLAMATION_CLIENT,
                  },
                  { value: ROLES.RETOUR_CLIENT, label: ROLES.RETOUR_CLIENT },
                  { value: "site01", label: "Site 01" },
                  { value: "site02", label: "Site 02" },
                  { value: ROLES.CONSOMMATEUR, label: ROLES.CONSOMMATEUR },
                ]}
                error={editErrors.claim_origin}
                disabled={true}
              />
            </div>

            {/* Valuation */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Valorisation (DZD) *
              </label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={editFormData.valuation?.toString() || ""}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleEditInputChange(
                    "valuation",
                    parseFloat(e.target.value) || 0
                  )
                }
                error={editErrors.valuation}
              />
            </div>
          </div>

          {/* Détail de la réclamation */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Détail de la réclamation *
            </label>
            {["site01", "site02"].includes(editFormData.claim_origin || "") ? (
              <Input
                type="text"
                value={
                  editFormData.claim_origin === "site01" ? "Site 01" : "Site 02"
                }
                disabled
                className="w-full bg-gray-100"
              />
            ) : ["Réclamation client", "Retour client"].includes(
                editFormData.claim_origin || ""
              ) && clients.length > 0 ? (
              <>
                <SearchableSelect
                  value={editSelectedClient}
                  onChange={(value) => {
                    const selected = clients.find((c) => c.id === value);
                    setEditSelectedClient(value);
                    // Store client name in claim_origin_detail and ID in claim_origin_client_id
                    handleEditInputChange(
                      "claim_origin_detail",
                      selected?.name || ""
                    );
                    handleEditInputChange("claim_origin_client_id", value);
                  }}
                  options={[
                    { value: "", label: "Sélectionnez un client" },
                    ...clients.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                  placeholder="Sélectionnez un client"
                  searchPlaceholder="Rechercher un client..."
                  error={editErrors.claim_origin_detail}
                />
                {editErrors.claim_origin_detail && (
                  <p className="text-destructive text-sm mt-1">
                    {editErrors.claim_origin_detail}
                  </p>
                )}
              </>
            ) : (
              <>
                <textarea
                  value={editFormData.claim_origin_detail || ""}
                  onChange={(e) =>
                    handleEditInputChange("claim_origin_detail", e.target.value)
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  placeholder="Détails de la réclamation..."
                />
                {editErrors.claim_origin_detail && (
                  <p className="text-destructive text-sm mt-1">
                    {editErrors.claim_origin_detail}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Détails complémentaires */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-foreground mb-2">
              Détails complémentaires
            </label>
            <textarea
              value={editFormData.description_details || ""}
              onChange={(e) =>
                handleEditInputChange("description_details", e.target.value)
              }
              rows={2}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Informations complémentaires..."
            />
          </div>

          {/* Performance */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Performance
            </label>
            <textarea
              value={editFormData.performance || ""}
              onChange={(e) =>
                handleEditInputChange("performance", e.target.value)
              }
              rows={2}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              placeholder="Notes de performance..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setFullEditModalOpen(false)}
              disabled={loading}
              className="px-6"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSaveFullEdit}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 px-6"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enregistrement...
                </>
              ) : (
                "Enregistrer les modifications"
              )}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Picture View Modal */}
      <Dialog
        isOpen={pictureViewModalOpen}
        onClose={() => setPictureViewModalOpen(false)}
        title="Photo attaché"
        maxWidth="4xl"
      >
        <div className="space-y-4">
          {viewingPicture && (
            <div className="flex justify-center">
              <img
                src={viewingPicture}
                alt="Photo de la non-conformité"
                className="max-w-full max-h-[70vh] object-contain rounded-lg border border-border shadow-lg"
              />
            </div>
          )}
          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => setPictureViewModalOpen(false)}
              className="px-6"
            >
              Fermer
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
