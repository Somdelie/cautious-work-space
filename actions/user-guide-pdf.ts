"use server";

import { jsPDF } from "jspdf";

export async function generateUserGuidePDF(): Promise<{
  success: boolean;
  data?: string;
  filename?: string;
  error?: string;
}> {
  try {
    const doc = new jsPDF();
    let yPosition = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;

    const checkNewPage = (neededSpace: number = 20) => {
      if (yPosition > pageHeight - neededSpace) {
        doc.addPage();
        yPosition = 15;
      }
    };

    const addTitle = (title: string) => {
      checkNewPage(25);
      doc.setFillColor(41, 128, 185);
      doc.rect(0, yPosition, pageWidth, 12, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, pageWidth / 2, yPosition + 8, { align: "center" });
      doc.setTextColor(0, 0, 0);
      yPosition += 18;
    };

    const addSectionHeader = (title: string) => {
      checkNewPage(15);
      doc.setFillColor(52, 152, 219);
      doc.rect(margin, yPosition, contentWidth, 8, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin + 3, yPosition + 5.5);
      doc.setTextColor(0, 0, 0);
      yPosition += 12;
    };

    const addSubheader = (title: string) => {
      checkNewPage(12);
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.text(title, margin, yPosition);
      yPosition += 7;
    };

    const addText = (text: string, indent: number = 0) => {
      checkNewPage(10);
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      lines.forEach((line: string) => {
        checkNewPage(6);
        doc.text(line, margin + indent, yPosition);
        yPosition += 5;
      });
    };

    const addBullet = (text: string) => {
      checkNewPage(10);
      doc.setFontSize(9);
      doc.text("•", margin + 5, yPosition);
      const lines = doc.splitTextToSize(text, contentWidth - 15);
      lines.forEach((line: string, index: number) => {
        checkNewPage(6);
        doc.text(line, margin + 10, yPosition);
        if (index < lines.length - 1) yPosition += 5;
      });
      yPosition += 6;
    };

    const addSpace = (amount: number = 5) => {
      yPosition += amount;
    };

    // Cover Page
    doc.setFillColor(52, 73, 94);
    doc.rect(0, 0, pageWidth, pageHeight, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("Job Management System", pageWidth / 2, 80, { align: "center" });
    doc.setFontSize(24);
    doc.text("User Guide", pageWidth / 2, 100, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Complete Documentation", pageWidth / 2, 120, { align: "center" });
    doc.text(
      `Generated: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      250,
      { align: "center" }
    );

    doc.addPage();
    doc.setTextColor(0, 0, 0);
    yPosition = 15;

    // Overview
    addTitle("OVERVIEW");
    addText(
      "The Job Management System is a comprehensive application designed to help construction or project-based teams manage jobs, orders, products, suppliers, and project managers efficiently."
    );
    addSpace();

    addSubheader("Key Features:");
    addBullet("Job Tracking: Create and monitor jobs with site information");
    addBullet(
      "Order Management: Track orders with detailed product information"
    );
    addBullet("Product Catalog: Manage product types and suppliers");
    addBullet("Supplier Management: Maintain supplier information");
    addBullet("Manager Directory: Keep track of project managers");
    addBullet("PDF Reports: Generate professional reports for job orders");
    addSpace(10);

    // Getting Started
    addSectionHeader("GETTING STARTED");

    addSubheader("Signing In");
    addText("1. Navigate to the application URL");
    addText("2. Click on Sign In");
    addText("3. Enter your credentials");
    addText("4. You'll be redirected to the main dashboard");
    addSpace();

    addSubheader("Dashboard Navigation");
    addText("The sidebar provides access to:");
    addBullet("Jobs: View and manage all jobs");
    addBullet("Managers: Manage project managers");
    addBullet("Products: View and manage product types");
    addBullet("Suppliers: Manage supplier information");
    addSpace(10);

    // Managing Jobs
    addSectionHeader("MANAGING JOBS");

    addSubheader("Creating a New Job");
    addText("1. Navigate to the Jobs page");
    addText("2. Click the Create Job button");
    addText("3. Fill in required information:");
    addBullet("Job Number: Unique identifier");
    addBullet("Site Name: Location or project name");
    addBullet("Manager: Select from existing managers");
    addBullet("Supplier: Select the supplier");
    addText("4. Click Create Job");
    addSpace();

    addSubheader("Job Status");
    addText("Jobs have three states:");
    addBullet("Not Started: Initial state");
    addBullet("In Progress: Click 'Start Job' to activate");
    addBullet("Finished: Click 'Finish Job' to complete");
    addSpace();

    addSubheader("Viewing Job Details");
    addText("Click on any job row to see:");
    addBullet("Job information (number, site name)");
    addBullet("Manager details (name, email, phone)");
    addBullet("Supplier information");
    addBullet("Job status badges");
    addBullet("Assigned products");
    addBullet("All orders for the job");
    addSpace(10);

    // Managing Orders
    addSectionHeader("MANAGING ORDERS");

    addSubheader("Creating an Order");
    addText("1. Open a job's detail view");
    addText("2. Click Create Order button");
    addText("3. Fill in order number");
    addText("4. Add order items:");
    addBullet("Product Type: Select from available products");
    addBullet("Quantity: Enter the amount");
    addBullet("Unit: Specify unit (e.g., 20L, 5kg)");
    addText("5. Click Add Item for more products");
    addText("6. Click Create Order");
    addSpace();

    addSubheader("Order Features");
    addBullet("Search: Filter orders by number or product type");
    addBullet("Sorting: Click column headers to sort");
    addBullet("Pagination: Navigate through orders (5 per page)");
    addBullet("Delete: Remove orders when needed");
    addSpace(10);

    // Managing Products
    addSectionHeader("MANAGING PRODUCTS");

    addSubheader("Creating a Product Type");
    addText("1. Navigate to Products page");
    addText("2. Click Create Product Type");
    addText("3. Fill in:");
    addBullet("Type: Name of the product (e.g., Primer, Paint)");
    addBullet("Shortcut: Optional abbreviation");
    addBullet("Supplier: Select the supplier");
    addText("4. Click Create");
    addSpace();

    addSubheader("Managing Products");
    addBullet("Edit: Update product information");
    addBullet("Delete: Remove unused products");
    addText("Note: Cannot delete products assigned to jobs or used in orders");
    addSpace(10);

    // Managing Suppliers
    addSectionHeader("MANAGING SUPPLIERS");

    addSubheader("Adding a Supplier");
    addText("1. Navigate to Suppliers page");
    addText("2. Click Create Supplier");
    addText("3. Fill in:");
    addBullet("Name: Supplier company name");
    addBullet("Logo URL: Optional supplier logo");
    addText("4. Click Create");
    addSpace();

    addSubheader("Editing Suppliers");
    addText("Click the Edit button to update supplier information.");
    addText("Note: Cannot delete suppliers associated with jobs or products");
    addSpace(10);

    // Managing Managers
    addSectionHeader("MANAGING MANAGERS");

    addSubheader("Adding a Manager");
    addText("1. Navigate to Managers page");
    addText("2. Click Create Manager");
    addText("3. Fill in:");
    addBullet("Name: Manager's full name");
    addBullet("Phone: Contact phone (optional)");
    addBullet("Email: Email address (optional)");
    addText("4. Click Create");
    addSpace();

    addSubheader("Manager Information");
    addText("Keep manager contact details updated for quick communication.");
    addText("Note: Cannot delete managers assigned to active jobs");
    addSpace(10);

    // Exporting Reports
    addSectionHeader("EXPORTING REPORTS");

    addSubheader("Generating Job Order PDF");
    addText("1. Open a job's detail view");
    addText("2. Click the Download PDF button");
    addText("3. PDF will be generated and downloaded automatically");
    addSpace();

    addSubheader("PDF Contents");
    addText("The generated PDF includes:");
    addBullet("Professional header with generation date");
    addBullet("Job information (number and site name)");
    addBullet("Manager details (name, email, phone)");
    addBullet("Supplier information");
    addBullet("Ordered totals (aggregated by product type)");
    addBullet("Detailed orders with items, quantities, and units");
    addSpace();

    addSubheader("PDF Features");
    addBullet("Professional design with color-coded sections");
    addBullet("Tables with alternating row colors");
    addBullet("Automatic pagination for long reports");
    addBullet("Formatted dates and clear typography");
    addSpace(10);

    // Tips & Best Practices
    addSectionHeader("TIPS & BEST PRACTICES");

    addSubheader("General Tips");
    addBullet("Use descriptive job numbers (e.g., SITE-001, PROJECT-ABC-2024)");
    addBullet("Keep manager information updated");
    addBullet("Standardize units across orders (e.g., always '20L')");
    addBullet("Export PDFs regularly for record-keeping");
    addBullet("Delete carefully - removing jobs also deletes orders");
    addSpace();

    addSubheader("Order Management");
    addBullet("Use logical order numbers (sequential or date-based)");
    addBullet("Verify quantities and units before creating orders");
    addBullet("Use search for jobs with many orders");
    addBullet("Review aggregated totals before ordering");
    addSpace();

    addSubheader("Workflow Suggestion");
    addText("Starting a New Job:");
    addText("1. Create manager entry (if needed)", 5);
    addText("2. Create supplier entry (if needed)", 5);
    addText("3. Create product types (if needed)", 5);
    addText("4. Create the job", 5);
    addText("5. Assign required products", 5);
    addText("6. Start the job when work begins", 5);
    addText("7. Create orders as needed", 5);
    addText("8. Mark job as finished", 5);
    addText("9. Export final PDF report", 5);
    addSpace(10);

    // Troubleshooting
    addSectionHeader("TROUBLESHOOTING");

    addSubheader("Common Issues");

    addText("Can't see orders in a job:");
    addBullet("Ensure orders have been created for that job");
    addBullet("Check if filters are applied");
    addSpace();

    addText("PDF won't download:");
    addBullet("Check browser download settings");
    addBullet("Ensure pop-ups are allowed");
    addBullet("Refresh page and try again");
    addSpace();

    addText("Can't delete a record:");
    addBullet("Check if it's being used elsewhere");
    addBullet("Review the error message");
    addSpace();

    addText("Search not working:");
    addBullet("Ensure at least one order exists");
    addBullet("Try refreshing the page");
    addBullet("Clear browser cache");
    addSpace(10);

    // Quick Reference
    addSectionHeader("QUICK REFERENCE");

    addSubheader("Color Coding");
    addBullet("Blue: Active/Selected items");
    addBullet("Green: Success messages");
    addBullet("Red: Errors or delete actions");
    addBullet("Gray: Inactive or informational items");
    addSpace();

    addSubheader("Status Indicators");
    addBullet("Not Started: Job hasn't begun");
    addBullet("In Progress: Job is active");
    addBullet("Finished: Job is complete");
    addSpace();

    addSubheader("System Requirements");
    addBullet("Modern web browser (Chrome, Firefox, Safari, Edge)");
    addBullet("Stable internet connection");
    addBullet("JavaScript enabled");
    addBullet("Pop-ups allowed for PDF downloads");
    addSpace(15);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      "For questions or support, contact your system administrator.",
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    doc.text(
      `Version 1.0 | Generated: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      yPosition + 5,
      { align: "center" }
    );

    // Generate base64 PDF
    const pdfBase64 = doc.output("datauristring").split(",")[1];

    return {
      success: true,
      data: pdfBase64,
      filename: `Job_Management_System_User_Guide.pdf`,
    };
  } catch (error) {
    console.error("Error generating user guide PDF:", error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}
