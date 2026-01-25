/**
 * GD Official Format Parser - Improved Version
 * Extracts detail items (Fields 37-48) from official Pakistan Customs GD forms
 * Supports both GD-I (Page 1) and GD-II (Page 2/continuation sheets)
 */

import * as XLSX from "xlsx";

export interface GDItem {
  itemNo: number;
  unitType: string;
  quantity: number;
  coCode: string;
  sroNumber: string;
  hsCode: string;
  itemDescription: string;
  declaredUnitValue: number;
  assessedUnitValue: number;
  totalDeclaredValue: number;
  totalAssessedValue: number;
  customDeclaredValue: number;
  customAssessedValue: number;
  levyCd: number;
  levySt: number;
  levyRd: number;
  levyAsd: number;
  levyAst: number;
  levyAcd: number;
  levyIt: number;
  rateCd: number;
  rateSt: number;
  rateRd: number;
  rateAsd: number;
  rateAst: number;
  rateAcd: number;
  rateIt: number;
  payableCd: number;
  payableSt: number;
  payableRd: number;
  payableAsd: number;
  payableAst: number;
  payableAcd: number;
  payableIt: number;
}

/**
 * Parse official GD Excel files (both .xls and .xlsx formats)
 */
export function parseGDOfficialFormat(file: File): Promise<GDItem[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const items: GDItem[] = [];

        // Process all sheets
        workbook.SheetNames.forEach((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const sheetItems = extractItemsFromSheet(worksheet);
          items.push(...sheetItems);
        });

        console.log(`Parsed ${items.length} items from GD file`);

        if (items.length === 0) {
          reject(
            new Error("No items found in GD file. Please check the format."),
          );
          return;
        }

        resolve(items);
      } catch (error) {
        console.error("Parse error:", error);
        reject(new Error(`Failed to parse GD file: ${error}`));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsArrayBuffer(file);
  });
}

/**
 * Extract items from a worksheet
 */
function extractItemsFromSheet(worksheet: XLSX.WorkSheet): GDItem[] {
  const items: GDItem[] = [];

  // Convert sheet to array of arrays for easier processing
  const sheetData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  console.log(`Processing sheet with ${sheetData.length} rows`);

  let currentItem: Partial<GDItem> | null = null;
  let itemHeaderFound = false;

  for (let i = 0; i < sheetData.length; i++) {
    const row = sheetData[i];
    if (!row || row.length === 0) continue;

    // Convert row to string for pattern matching
    const rowStr = row.join(" ").toUpperCase();

    // Step 1: Find the "37.ITEM NO" header row
    if (rowStr.includes("37.ITEM NO") || rowStr.includes("ITEM NO")) {
      itemHeaderFound = true;
      console.log(`Found item header at row ${i + 1}`);

      // Save any previous item
      if (currentItem && currentItem.itemNo) {
        items.push(finalizeItem(currentItem));
        currentItem = null;
      }
      continue;
    }

    // Only process items after header is found
    if (!itemHeaderFound) continue;

    // Step 2: Detect item number row
    // Look for: numeric value (as string or number) in first few columns AND "(a)Unit Type" text
    // Exclude: rows with 6+ numeric values (those are value rows, not item rows)
    const firstValue = row[0] || row[1];
    const firstValueNum =
      typeof firstValue === "number"
        ? firstValue
        : typeof firstValue === "string"
          ? parseFloat(firstValue)
          : NaN;

    if (!isNaN(firstValueNum) && firstValueNum > 0 && firstValueNum < 50) {
      // Count how many numeric values this row has
      const numericCount = row.filter((cell: any) => {
        const num =
          typeof cell === "number"
            ? cell
            : typeof cell === "string"
              ? parseFloat(cell)
              : NaN;
        return !isNaN(num) && num > 0;
      }).length;

      // If this row has 6+ numeric values, it's probably a values row, not an item row
      if (numericCount >= 6) {
        console.log(
          `Row ${i + 1}: Skipping (${numericCount} numbers - looks like values row)`,
        );
        continue;
      }

      // Check if this row or next row has unit type indicator
      // But exclude if the SRO text is in the first column itself (field label like "49.SRO / Test Report")
      const firstColStr = String(row[0] || "").toUpperCase();
      const isSroInFirstCol =
        firstColStr.includes("SRO") ||
        firstColStr.includes("TEST") ||
        firstColStr.includes("REPORT");

      const hasUnitTypeIndicator =
        !isSroInFirstCol &&
        (rowStr.includes("UNIT TYPE") ||
          rowStr.includes("SRO1640") ||
          rowStr.includes("SRO ") || // Actual SRO numbers
          (i + 1 < sheetData.length &&
            sheetData[i + 1].join(" ").toUpperCase().includes("KG")));

      if (hasUnitTypeIndicator) {
        console.log(`Found item ${firstValueNum} at row ${i + 1}`);

        // Save previous item
        if (currentItem && currentItem.itemNo) {
          items.push(finalizeItem(currentItem));
        }

        // Start new item
        currentItem = initializeItem();
        currentItem.itemNo = firstValueNum;

        // Try to extract SRO from this row (but not from first column)
        for (let j = 2; j < row.length; j++) {
          // Start from column 2, not 0
          const cell = row[j];
          if (cell && String(cell).toUpperCase().includes("SRO1640")) {
            currentItem.sroNumber = String(cell);
            break;
          }
        }

        continue;
      }
    }

    // Step 3: Parse quantity row (KG, PCS, U, MT, etc.)
    if (currentItem && !currentItem.unitType) {
      const unitTypes = ["KG", "PCS", "U", "MT", "UNIT", "UNITS"];
      for (const ut of unitTypes) {
        if (rowStr.includes(ut)) {
          // Found unit type row
          console.log(`Found quantity row at ${i + 1}`);

          // Extract data from this row
          for (let j = 0; j < row.length; j++) {
            const cell = row[j];
            if (!cell) continue;

            const cellStr = String(cell).trim().toUpperCase();

            // Unit type
            if (
              unitTypes.some((ut) => cellStr === ut || cellStr === ut + "S")
            ) {
              currentItem.unitType = cellStr.replace(/S$/, "");
            }

            // Quantity (number with decimals, usually 4 decimal places)
            const numVal =
              typeof cell === "number"
                ? cell
                : typeof cell === "string"
                  ? parseFloat(cell)
                  : NaN;
            if (!isNaN(numVal) && numVal > 0 && numVal < 1000000) {
              if (!currentItem.quantity || currentItem.quantity === 0) {
                currentItem.quantity = numVal;
              }
            }

            // Country code
            if (
              cellStr === "CHINA" ||
              cellStr === "USA" ||
              cellStr === "UK" ||
              cellStr === "JAPAN" ||
              cellStr === "GERMANY" ||
              cellStr === "KOREA"
            ) {
              currentItem.coCode = cellStr;
            }

            // HS Code (format: 8517.7100 or similar)
            if (typeof cell === "string" && /^\d{4}\.\d{4}/.test(cell)) {
              currentItem.hsCode = cell;
            } else if (
              typeof cell === "string" &&
              /^\d{8}/.test(cell) &&
              cell.length === 8
            ) {
              // Sometimes HS code stored as string without decimal
              currentItem.hsCode =
                cell.substring(0, 4) + "." + cell.substring(4);
            } else if (
              typeof cell === "number" &&
              cell > 1000 &&
              cell < 100000
            ) {
              // Sometimes HS code loses decimal formatting
              const hsStr = cell.toString();
              if (hsStr.length >= 7) {
                currentItem.hsCode =
                  hsStr.substring(0, 4) + "." + hsStr.substring(4);
              }
            }
          }

          // Also check SRO in this row if not found earlier
          if (!currentItem.sroNumber) {
            for (let j = 0; j < row.length; j++) {
              const cell = row[j];
              if (
                cell &&
                (String(cell).includes("SRO1640") ||
                  String(cell).match(/SRO.*\d{4}/))
              ) {
                currentItem.sroNumber = String(cell);
                break;
              }
            }
          }

          continue;
        }
      }
    }

    // Step 4: Parse description row
    if (currentItem && !currentItem.itemDescription) {
      // Description is usually a long text (> 30 characters)
      for (const cell of row) {
        if (cell && typeof cell === "string" && cell.length > 30) {
          const cellUpper = cell.toUpperCase();
          // Avoid header texts
          if (
            !cellUpper.includes("ITEM DESCRIPTION") &&
            !cellUpper.includes("UNIT VALUE") &&
            !cellUpper.includes("LEVY")
          ) {
            currentItem.itemDescription = cell.trim();
            console.log(`Found description: ${cell.substring(0, 50)}...`);
            break;
          }
        }
      }
    }

    // Step 5: Parse levy rows (CD, ST, RD, etc.)
    if (currentItem) {
      const levyMatch = rowStr.match(/^\s*(CD|ST|RD|ASD|AST|ACD|IT)\s/);
      if (levyMatch) {
        const levyType = levyMatch[1];
        console.log(`Found levy type: ${levyType}`);

        // Find rate (small number, usually < 100) and payable (larger number)
        let rate = 0;
        let payable = 0;

        for (const cell of row) {
          const numVal =
            typeof cell === "number"
              ? cell
              : typeof cell === "string"
                ? parseFloat(cell)
                : NaN;
          if (!isNaN(numVal)) {
            if (numVal > 0 && numVal <= 100 && rate === 0) {
              rate = numVal;
            } else if (numVal > 100) {
              payable = numVal;
            }
          }
        }

        // Store in appropriate fields
        switch (levyType) {
          case "CD":
            currentItem.rateCd = rate;
            currentItem.payableCd = payable;
            break;
          case "ST":
            currentItem.rateSt = rate;
            currentItem.payableSt = payable;
            break;
          case "RD":
            currentItem.rateRd = rate;
            currentItem.payableRd = payable;
            break;
          case "ASD":
            currentItem.rateAsd = rate;
            currentItem.payableAsd = payable;
            break;
          case "AST":
            currentItem.rateAst = rate;
            currentItem.payableAst = payable;
            break;
          case "ACD":
            currentItem.rateAcd = rate;
            currentItem.payableAcd = payable;
            break;
          case "IT":
            currentItem.rateIt = rate;
            currentItem.payableIt = payable;
            break;
        }
      }
    }

    // Step 6: Parse unit values row (Field 43)
    // This row has: Declared, Assessed values repeated 3 times
    if (
      currentItem &&
      rowStr.includes("DECLARED") &&
      rowStr.includes("ASSESSED")
    ) {
      // The actual values are usually 2-3 rows down (skip empty rows and levy rows)
      // Look ahead up to 5 rows to find the row with 6 numeric values
      for (let lookAhead = 1; lookAhead <= 5; lookAhead++) {
        if (i + lookAhead >= sheetData.length) break;

        const valueRow = sheetData[i + lookAhead];
        const numbers = valueRow
          .map((cell: any) =>
            typeof cell === "number"
              ? cell
              : typeof cell === "string"
                ? parseFloat(cell)
                : NaN,
          )
          .filter((n: number) => !isNaN(n) && n > 0);

        // We need exactly 6 values: Decl Unit, Assd Unit, Decl Total, Assd Total, Decl Custom, Assd Custom
        if (numbers.length >= 6) {
          currentItem.declaredUnitValue = numbers[0];
          currentItem.assessedUnitValue = numbers[1];
          currentItem.totalDeclaredValue = numbers[2];
          currentItem.totalAssessedValue = numbers[3];
          currentItem.customDeclaredValue = numbers[4];
          currentItem.customAssessedValue = numbers[5];
          console.log(
            `Found values at offset ${lookAhead}: ${numbers.slice(0, 6).join(", ")}`,
          );
          break;
        }
      }
    }
  }

  // Don't forget the last item
  if (currentItem && currentItem.itemNo) {
    items.push(finalizeItem(currentItem));
  }

  console.log(`Extracted ${items.length} items total`);
  return items;
}

function initializeItem(): Partial<GDItem> {
  return {
    itemNo: 0,
    unitType: "",
    quantity: 0,
    coCode: "",
    sroNumber: "",
    hsCode: "",
    itemDescription: "",
    declaredUnitValue: 0,
    assessedUnitValue: 0,
    totalDeclaredValue: 0,
    totalAssessedValue: 0,
    customDeclaredValue: 0,
    customAssessedValue: 0,
    levyCd: 0,
    levySt: 0,
    levyRd: 0,
    levyAsd: 0,
    levyAst: 0,
    levyAcd: 0,
    levyIt: 0,
    rateCd: 0,
    rateSt: 0,
    rateRd: 0,
    rateAsd: 0,
    rateAst: 0,
    rateAcd: 0,
    rateIt: 0,
    payableCd: 0,
    payableSt: 0,
    payableRd: 0,
    payableAsd: 0,
    payableAst: 0,
    payableAcd: 0,
    payableIt: 0,
  };
}

function finalizeItem(item: Partial<GDItem>): GDItem {
  return {
    itemNo: item.itemNo || 0,
    unitType: item.unitType || "",
    quantity: item.quantity || 0,
    coCode: item.coCode || "",
    sroNumber: item.sroNumber || "",
    hsCode: item.hsCode || "",
    itemDescription: item.itemDescription || "",
    declaredUnitValue: item.declaredUnitValue || 0,
    assessedUnitValue: item.assessedUnitValue || 0,
    totalDeclaredValue: item.totalDeclaredValue || 0,
    totalAssessedValue: item.totalAssessedValue || 0,
    customDeclaredValue: item.customDeclaredValue || 0,
    customAssessedValue: item.customAssessedValue || 0,
    levyCd: item.levyCd || 0,
    levySt: item.levySt || 0,
    levyRd: item.levyRd || 0,
    levyAsd: item.levyAsd || 0,
    levyAst: item.levyAst || 0,
    levyAcd: item.levyAcd || 0,
    levyIt: item.levyIt || 0,
    rateCd: item.rateCd || 0,
    rateSt: item.rateSt || 0,
    rateRd: item.rateRd || 0,
    rateAsd: item.rateAsd || 0,
    rateAst: item.rateAst || 0,
    rateAcd: item.rateAcd || 0,
    rateIt: item.rateIt || 0,
    payableCd: item.payableCd || 0,
    payableSt: item.payableSt || 0,
    payableRd: item.payableRd || 0,
    payableAsd: item.payableAsd || 0,
    payableAst: item.payableAst || 0,
    payableAcd: item.payableAcd || 0,
    payableIt: item.payableIt || 0,
  };
}
