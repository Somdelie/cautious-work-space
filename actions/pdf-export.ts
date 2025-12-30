"use server";

import { prisma } from "@/lib/prisma";
import { jsPDF } from "jspdf";

interface JobDataForPDF {
  id: string;
  jobNumber: string;
  siteName: string;
  manager: {
    name: string;
    phone: string | null;
    email: string | null;
  };
  supplier: {
    name: string;
  };
  orders: Array<{
    orderNumber: string;
    createdAt: string | Date;
    items: Array<{
      quantity: number;
      unit: string;
      productType: {
        id: string;
        type: string;
      };
    }>;
  }>;
}

export async function generateJobOrderPDF(
  jobId: string
): Promise<
  | { success: true; data: string; filename: string }
  | { success: false; error: string }
> {
  try {
    const job = (await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        manager: true,
        supplier: true,
        orders: {
          include: {
            items: {
              include: {
                productType: true,
              },
            },
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    })) as JobDataForPDF | null;

    if (!job) {
      return { success: false, error: "Job not found" };
    }

    // Create PDF with jsPDF
    const doc = new jsPDF();
    let yPosition = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    // Helper function to add section header
    const addSectionHeader = (title: string) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 15;
      }
      doc.setFillColor(41, 128, 185); // Blue background
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      doc.setTextColor(255, 255, 255); // White text
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 3, yPosition + 5.5);
      doc.setTextColor(0, 0, 0); // Reset to black
      yPosition += 12;
    };

    // Title section with background
    doc.setFillColor(52, 73, 94); // Dark blue
    doc.rect(0, 0, pageWidth, 35, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("JOB ORDER REPORT", pageWidth / 2, 15, { align: "center" });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated on ${new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}`,
      pageWidth / 2,
      25,
      { align: "center" }
    );
    doc.setTextColor(0, 0, 0);
    yPosition = 45;

    // Job Information Box
    addSectionHeader("JOB INFORMATION");
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, yPosition, contentWidth, 18, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Job Number:", margin + 3, yPosition + 6);
    doc.text("Site Name:", margin + 3, yPosition + 12);
    doc.setFont("helvetica", "normal");
    doc.text(job.jobNumber, margin + 35, yPosition + 6);
    doc.text(job.siteName, margin + 35, yPosition + 12);
    yPosition += 22;

    // Manager & Supplier in two columns
    const colWidth = contentWidth / 2 - 2;

    // Manager Information
    addSectionHeader("MANAGER DETAILS");
    doc.setFillColor(250, 250, 250);
    const managerHeight =
      12 + (job.manager.email ? 6 : 0) + (job.manager.phone ? 6 : 0);
    doc.rect(margin, yPosition, colWidth, managerHeight, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Name:", margin + 3, yPosition + 5);
    doc.setFont("helvetica", "normal");
    doc.text(job.manager.name, margin + 18, yPosition + 5);
    let managerY = yPosition + 10;

    if (job.manager.email) {
      doc.setFont("helvetica", "bold");
      doc.text("Email:", margin + 3, managerY);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text(job.manager.email, margin + 18, managerY);
      doc.setFontSize(9);
      managerY += 5;
    }

    if (job.manager.phone) {
      doc.setFont("helvetica", "bold");
      doc.text("Phone:", margin + 3, managerY);
      doc.setFont("helvetica", "normal");
      doc.text(job.manager.phone, margin + 18, managerY);
    }

    // Supplier Information (right column)
    doc.setFillColor(41, 128, 185);
    doc.rect(margin + colWidth + 4, yPosition - 12, colWidth, 8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("SUPPLIER DETAILS", margin + colWidth + 7, yPosition - 6.5);
    doc.setTextColor(0, 0, 0);

    doc.setFillColor(250, 250, 250);
    doc.rect(margin + colWidth + 4, yPosition, colWidth, 12, "F");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Company:", margin + colWidth + 7, yPosition + 5);
    doc.setFont("helvetica", "normal");
    doc.text(job.supplier.name, margin + colWidth + 25, yPosition + 5);

    yPosition += Math.max(managerHeight, 12) + 8;

    // Ordered Totals
    if (job.orders.length > 0) {
      addSectionHeader("ORDERED TOTALS (AGGREGATED)");

      const totals = new Map();
      job.orders.forEach((o) =>
        o.items.forEach((it) => {
          const ptId = it.productType.id;
          if (!totals.has(ptId)) {
            totals.set(ptId, {
              type: it.productType.type,
              byUnit: new Map(),
            });
          }
          const entry = totals.get(ptId);
          const unit = it.unit || "";
          const prev = entry.byUnit.get(unit) || 0;
          entry.byUnit.set(unit, prev + Number(it.quantity));
        })
      );

      // Create table for totals
      const tableData: string[][] = [];
      totals.forEach((value) => {
        const unitParts: string[] = [];
        value.byUnit.forEach((sum: number, unit: string) => {
          const trimmedUnit = unit.trim();
          unitParts.push(`${sum}${trimmedUnit ? " x " + trimmedUnit : ""}`);
        });
        tableData.push([value.type, unitParts.join(", ")]);
      });

      // Draw table
      doc.setFillColor(240, 240, 240);
      const rowHeight = 7;
      const col1Width = contentWidth * 0.4;
      const col2Width = contentWidth * 0.6;

      // Table header
      doc.setFillColor(52, 152, 219);
      doc.rect(margin, yPosition, col1Width, rowHeight, "F");
      doc.rect(margin + col1Width, yPosition, col2Width, rowHeight, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Product Type", margin + 2, yPosition + 5);
      doc.text("Total Quantity", margin + col1Width + 2, yPosition + 5);
      doc.setTextColor(0, 0, 0);
      yPosition += rowHeight;

      // Table rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      tableData.forEach((row, index) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 15;
        }

        if (index % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, yPosition, contentWidth, rowHeight, "F");
        }

        doc.setDrawColor(220, 220, 220);
        doc.rect(margin, yPosition, col1Width, rowHeight, "S");
        doc.rect(margin + col1Width, yPosition, col2Width, rowHeight, "S");

        doc.text(row[0], margin + 2, yPosition + 5);
        doc.text(row[1], margin + col1Width + 2, yPosition + 5);
        yPosition += rowHeight;
      });

      yPosition += 8;

      // Detailed Orders
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 15;
      }

      addSectionHeader("DETAILED ORDERS");

      job.orders.forEach((order, orderIndex) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = 15;
        }

        // Order header
        doc.setFillColor(236, 240, 241);
        doc.rect(margin, yPosition, contentWidth, 8, "F");
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        const orderDate = new Date(order.createdAt).toLocaleDateString(
          "en-US",
          {
            year: "numeric",
            month: "short",
            day: "numeric",
          }
        );
        doc.text(`Order #${order.orderNumber}`, margin + 2, yPosition + 5.5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(orderDate, contentWidth + margin - 2, yPosition + 5.5, {
          align: "right",
        });
        yPosition += 10;

        // Order items table
        const itemRowHeight = 6;
        const itemCol1 = contentWidth * 0.2;
        const itemCol2 = contentWidth * 0.8;

        // Items header
        doc.setFillColor(149, 165, 166);
        doc.rect(margin, yPosition, itemCol1, itemRowHeight, "F");
        doc.rect(margin + itemCol1, yPosition, itemCol2, itemRowHeight, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.text("Quantity", margin + 2, yPosition + 4);
        doc.text("Product Type", margin + itemCol1 + 2, yPosition + 4);
        doc.setTextColor(0, 0, 0);
        yPosition += itemRowHeight;

        // Items
        doc.setFont("helvetica", "normal");
        order.items.forEach((item, itemIndex) => {
          if (yPosition > pageHeight - 15) {
            doc.addPage();
            yPosition = 15;
          }

          if (itemIndex % 2 === 1) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, yPosition, contentWidth, itemRowHeight, "F");
          }

          doc.setDrawColor(230, 230, 230);
          doc.rect(margin, yPosition, itemCol1, itemRowHeight, "S");
          doc.rect(margin + itemCol1, yPosition, itemCol2, itemRowHeight, "S");

          const qty = item.quantity;
          const unit = item.unit?.trim() || "";
          const qtyText = `${qty}${unit ? " x " + unit : ""}`;

          doc.setFontSize(8);
          doc.text(qtyText, margin + 2, yPosition + 4);
          doc.text(item.productType.type, margin + itemCol1 + 2, yPosition + 4);
          yPosition += itemRowHeight;
        });

        if (orderIndex < job.orders.length - 1) {
          yPosition += 6;
        }
      });
    }

    // Generate base64 PDF
    const pdfBase64 = doc.output("datauristring").split(",")[1];

    return {
      success: true,
      data: pdfBase64,
      filename: `Job_${job.jobNumber}_Orders.pdf`,
    };
  } catch (error) {
    console.error("Error generating PDF:", error);
    return { success: false, error: (error as Error).message };
  }
}
