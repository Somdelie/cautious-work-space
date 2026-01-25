/* eslint-disable @next/next/no-img-element */
// components/icons/folder-icons.tsx

import React from "react";

interface IconProps {
  className?: string;
}

// Dashboard/Home Icon
export const DashboardIcon: React.FC<IconProps> = ({}) => (
  <img src="/icons/dashboard.svg" alt="icon" width={34} height={24} />
);

// Building/Company Icon for Suppliers
export const BuildingIcon: React.FC<IconProps> = ({ className = "" }) => (
  <img src="/icons/supplier3.png" alt="icon" width={34} height={24} />
);

// Package Icon for Products
export const PackageIcon: React.FC<IconProps> = ({ className = "" }) => (
  <img src="/icons/products.png" alt="icon" width={34} height={24} />
);

// Supervisors Icon for Managers
export const SupervisorsIcon: React.FC<IconProps> = ({ className = "" }) => (
  <img src="/icons/suppervisors.png" alt="icon" width={34} height={24} />
);

// Supervisors Icon for Managers
export const EmployeesIcon: React.FC<IconProps> = ({ className = "" }) => (
  <img src="/icons/employees.png" alt="icon" width={34} height={24} />
);

// Briefcase Icon for Jobs
export const BriefcaseIcon: React.FC<IconProps> = ({ className = "" }) => (
  <img src="/icons/briefcase.svg" alt="icon" width={34} height={24} />
);

// Yellow Folder Icon (generic)
export const FolderIcon: React.FC<IconProps & { color?: string }> = () => (
  <img src="/icons/pngwing.png" alt="icon" width={34} height={24} />
);
