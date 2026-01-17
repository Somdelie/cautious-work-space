3. Enter your credentials (the app uses email/password authentication)

# Job Management System - User Guide

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Features](#features)
4. [User Interface](#user-interface)
5. [Managing Jobs](#managing-jobs)
6. [Managing Orders](#managing-orders)
7. [Managing Products](#managing-products)
8. [Managing Suppliers](#managing-suppliers)
9. [Managing Managers](#managing-managers)
10. [Exporting Reports](#exporting-reports)
11. [Tips & Best Practices](#tips--best-practices)

---

## Overview

The **Job Management System** is a comprehensive application designed to help construction or project-based teams manage jobs, orders, products, suppliers, and project managers efficiently. The system provides:

- **Job Tracking**: Create and monitor jobs with site information
- **Order Management**: Track orders with detailed product information
- **Product Catalog**: Manage product types and suppliers
- **Supplier Management**: Maintain supplier information
- **Manager Directory**: Keep track of project managers and their contact details
- **PDF Reports**: Generate professional PDF reports for job orders

---

## Getting Started

### Signing In

1. Navigate to the application URL
2. Click on **Sign In**
3. Enter your credentials (the app uses Clerk authentication)
4. Once authenticated, you'll be redirected to the main dashboard

### Dashboard Overview

After signing in, you'll see the main navigation sidebar with the following sections:

- **Jobs**: View and manage all jobs
- **Managers**: Manage project managers
- **Products**: View and manage product types
- **Suppliers**: Manage supplier information

---

## Features

### Core Features

1. **Job Management**
   - Create, view, edit, and delete jobs
   - Track job status (Not Started, In Progress, Finished)
   - Associate jobs with managers and suppliers
   - Assign product types to jobs

2. **Order Management**
   - Create orders for specific jobs
   - Add multiple product items to orders
   - Search and filter orders
   - Sort orders by number, date, or items
   - Paginated view for easy navigation
   - Delete orders when needed

3. **Product Type Management**
   - Add product types with shortcuts
   - Associate products with suppliers
   - Edit and delete product types

4. **Supplier Management**
   - Add supplier information
   - Upload supplier logos
   - Edit supplier details
   - Delete suppliers

5. **Manager Management**
   - Add manager contact information
   - Store phone and email details
   - Edit and delete managers

6. **PDF Export**
   - Generate professional PDF reports
   - Includes job information, manager details, supplier info
   - Shows aggregated totals and detailed orders
   - Professional design with tables and color-coded sections

---

## User Interface

### Sidebar Navigation

The sidebar provides quick access to all main sections:

- **Theme Toggle**: Switch between light and dark modes
- **Jobs**: Access job management
- **Managers**: View all managers
- **Products**: Access product catalog
- **Suppliers**: Manage suppliers
- **User Button**: Access account settings and sign out

### Tables

All data tables include:

- **Sortable columns**: Click column headers to sort
- **Pagination**: Navigate through multiple pages
- **Search**: Filter data in real-time
- **Actions**: Edit and delete buttons for each row

---

## Managing Jobs

### Creating a New Job

1. Navigate to the **Jobs** page
2. Click the **Create Job** button (top right)
3. Fill in the required information:
   - **Job Number**: Unique identifier for the job
   - **Site Name**: Location or name of the project site
   - **Manager**: Select from existing managers
   - **Supplier**: Select the supplier for this job
4. Click **Create Job**

### Viewing Job Details

1. Click on any job row in the jobs table
2. A detailed dialog will open showing:
   - Job information (number, site name)
   - Manager details (name, email, phone)
   - Supplier information
   - Job status badges
   - Assigned products
   - All orders for this job

### Editing a Job

1. In the jobs table, click the **Edit** button for the desired job
2. Update any information as needed
3. Click **Save Changes**

### Managing Job Status

Jobs have three status states:

- **Not Started**: Initial state
- **In Progress**: Click "Start Job" to mark as in progress
- **Finished**: Click "Finish Job" to mark as complete

### Assigning Products to Jobs

1. Open a job's detail view
2. In the Products section, click **Assign Product**
3. Select product type and specify:
   - Quantity
   - Unit (e.g., 20L, 5kg, bags)
   - Whether it's required
4. Click **Assign Product**

### Deleting a Job

1. In the jobs table, click the **Delete** button
2. Confirm the deletion
3. The job and all associated orders will be deleted

---

## Managing Orders

### Creating an Order

1. Open a job's detail view
2. In the Orders section, click **Create Order** button
3. Fill in:
   - **Order Number**: Unique identifier for the order
4. Add order items:
   - **Product Type**: Select from available products
   - **Quantity**: Enter the amount
   - **Unit**: Specify the unit (e.g., 20L, 5kg)
5. Click **Add Item** to add more products
6. Click **Create Order**

### Searching Orders

In the orders table:

1. Use the search input at the top
2. Type to search by:
   - Order number
   - Product type name
3. Results update in real-time

### Sorting Orders

Click on column headers to sort:

- **Order #**: Alphabetically by order number
- **Total Items**: By number of items in the order
- **Created**: By creation date

Click the same header again to reverse the sort order.

### Pagination

- Shows 5 orders per page
- Use **Previous** and **Next** buttons to navigate
- View count shows current range (e.g., "Showing 1 to 5 of 12 orders")

### Deleting an Order

1. Click the **Delete** button next to the order
2. Confirm the deletion
3. The order will be removed

---

## Managing Products

### Creating a Product Type

1. Navigate to the **Products** page
2. Click **Create Product Type**
3. Fill in:
   - **Type**: Name of the product (e.g., "Primer", "Paint")
   - **Shortcut**: Optional abbreviation
   - **Supplier**: Select the supplier
4. Click **Create**

### Editing a Product Type

1. Click the **Edit** button next to the product
2. Update the information
3. Click **Save Changes**

### Deleting a Product Type

1. Click the **Delete** button
2. Confirm the deletion
3. Note: Cannot delete if assigned to jobs or used in orders

---

## Managing Suppliers

### Adding a Supplier

1. Navigate to the **Suppliers** page
2. Click **Create Supplier**
3. Fill in:
   - **Name**: Supplier company name
   - **Logo URL**: (Optional) URL to supplier logo
4. Click **Create**

### Editing a Supplier

1. Click the **Edit** button next to the supplier
2. Update the information
3. Click **Save Changes**

### Deleting a Supplier

1. Click the **Delete** button
2. Confirm the deletion
3. Note: Cannot delete if associated with jobs or products

---

## Managing Managers

### Adding a Manager

1. Navigate to the **Managers** page
2. Click **Create Manager**
3. Fill in:
   - **Name**: Manager's full name
   - **Phone**: Contact phone number (optional)
   - **Email**: Email address (optional)
4. Click **Create**

### Editing a Manager

1. Click the **Edit** button next to the manager
2. Update contact information
3. Click **Save Changes**

### Deleting a Manager

1. Click the **Delete** button
2. Confirm the deletion
3. Note: Cannot delete if assigned to active jobs

---

## Exporting Reports

### Generating Job Order PDF

1. Open a job's detail view
2. Click the **Download PDF** button (top right of the dialog)
3. The PDF will be generated and downloaded automatically

### PDF Contents

The generated PDF includes:

- **Header**: Professional title and generation date
- **Job Information**: Job number and site name
- **Manager Details**: Name, email, and phone
- **Supplier Information**: Company name
- **Ordered Totals**: Aggregated totals by product type
- **Detailed Orders**: Individual order breakdown with:
  - Order number and date
  - All items with quantities and units

The PDF features:

- Professional design with color-coded sections
- Tables with alternating row colors
- Proper pagination for long reports
- Formatted dates and clear typography

---

## Tips & Best Practices

### General Tips

1. **Use Descriptive Job Numbers**: Make them easy to identify (e.g., "SITE-001", "PROJECT-ABC-2024")

2. **Keep Manager Information Updated**: Always maintain current contact details for quick communication

3. **Standardize Units**: Use consistent units across orders (e.g., always "20L" not "20 L" or "20 liter")

4. **Regular Backups**: Export PDFs regularly for record-keeping

5. **Delete Carefully**: Deleting jobs also deletes all associated orders

### Order Management Tips

1. **Logical Order Numbers**: Use sequential or date-based numbering (e.g., "ORD-001", "2024-12-001")

2. **Verify Before Creating**: Double-check quantities and units before creating orders

3. **Use Search**: For jobs with many orders, use the search function to find specific items quickly

4. **Review Aggregated Totals**: Before ordering, check the aggregated totals in the job view or PDF

### Product Management Tips

1. **Use Shortcuts**: Create memorable shortcuts for frequently used products

2. **Organize by Supplier**: Keep products grouped by supplier for easier management

3. **Descriptive Names**: Use clear, unambiguous product type names

### Workflow Suggestions

#### Starting a New Job

1. Create the manager entry (if not exists)
2. Create the supplier entry (if not exists)
3. Create product types needed (if not exists)
4. Create the job
5. Assign required products to the job
6. Start the job when work begins
7. Create orders as needed
8. Mark job as finished when complete
9. Export final PDF report

#### Creating an Order

1. Open the job detail view
2. Review assigned products
3. Click "Create Order"
4. Add all required items
5. Verify quantities and units
6. Submit the order
7. Export PDF if needed for supplier communication

### Data Quality

1. **Avoid Duplicates**: Check existing entries before creating new managers or suppliers

2. **Consistent Formatting**: Use the same format for phone numbers and emails

3. **Complete Information**: Fill in all available fields for better tracking

4. **Regular Reviews**: Periodically review and clean up old or unused entries

### Performance

1. **Use Pagination**: For large datasets, use pagination instead of loading all records

2. **Filter First**: Use search/filter to narrow results before sorting

3. **Regular Cleanup**: Archive or delete completed jobs periodically

---

## Troubleshooting

### Common Issues

**Can't see orders in a job**

- Ensure orders have been created for that specific job
- Check if filters are applied

**PDF won't download**

- Check your browser's download settings
- Ensure pop-ups are allowed
- Refresh the page and try again

**Can't delete a record**

- Check if it's being used elsewhere (e.g., manager assigned to jobs)
- Review the error message for details

**Search not working**

- Make sure you have at least one order created
- Try refreshing the page
- Clear browser cache

### Getting Help

If you encounter issues:

1. Refresh the page (Ctrl+Shift+R or Cmd+Shift+R)
2. Clear browser cache
3. Check your internet connection
4. Contact your system administrator

---

## System Requirements

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection
- JavaScript enabled
- Pop-ups allowed for PDF downloads

---

## Version Information

Current Version: 1.0
Last Updated: December 30, 2025

---

## Quick Reference

### Keyboard Shortcuts

- **Search**: Click in any search box
- **Navigation**: Use sidebar menu
- **Close Dialogs**: Click outside or press ESC

### Color Coding

- **Blue**: Active/Selected items
- **Green**: Success messages
- **Red**: Errors or delete actions
- **Gray**: Inactive or informational items

### Status Indicators

- **Not Started**: Job hasn't begun
- **In Progress**: Job is active
- **Finished**: Job is complete

---

**For questions or support, please contact your system administrator.**
