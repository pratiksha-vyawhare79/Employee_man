import { Employee } from '../models/Employee';
import mongoose from 'mongoose';

/**
 * Checks if setting 'managerId' as manager of 'employeeId' would create a circular reporting chain.
 * A circular chain is created if 'employeeId' is an ancestor of 'managerId' in the reporting structure,
 * or if 'employeeId' is the same as 'managerId'.
 */
export const isCircularReporting = async (
  employeeId: string | mongoose.Types.ObjectId,
  managerId: string | mongoose.Types.ObjectId
): Promise<boolean> => {
  const empIdStr = employeeId.toString();
  const managerIdStr = managerId.toString();

  if (empIdStr === managerIdStr) {
    return true;
  }

  let currentManagerId = managerId;

  // Walk up the tree up to 100 levels to avoid infinite loops
  for (let i = 0; i < 100; i++) {
    const manager = await Employee.findById(currentManagerId);
    if (!manager || !manager.reportingManager || manager.isDeleted) {
      break;
    }

    const nextManagerId = manager.reportingManager.toString();
    if (nextManagerId === empIdStr) {
      return true;
    }

    currentManagerId = manager.reportingManager as any;
  }

  return false;
};

interface OrgNode {
  _id: string;
  employeeId: string;
  name: string;
  email: string;
  designation: string;
  department: string;
  status: string;
  role: string;
  profileImage?: string;
  children: OrgNode[];
}

/**
 * Builds a hierarchical tree from a flat list of employees
 */
export const buildHierarchyTree = (employees: any[]): OrgNode[] => {
  const idMap = new Map<string, OrgNode>();
  
  // Initialize nodes
  employees.forEach((emp) => {
    idMap.set(emp._id.toString(), {
      _id: emp._id.toString(),
      employeeId: emp.employeeId,
      name: emp.name,
      email: emp.email,
      designation: emp.designation,
      department: emp.department,
      status: emp.status,
      role: emp.role,
      profileImage: emp.profileImage || '',
      children: [],
    });
  });

  const roots: OrgNode[] = [];

  employees.forEach((emp) => {
    const node = idMap.get(emp._id.toString());
    if (node) {
      const parentId = emp.reportingManager ? emp.reportingManager.toString() : null;
      if (parentId && idMap.has(parentId)) {
        const parentNode = idMap.get(parentId);
        parentNode?.children.push(node);
      } else {
        roots.push(node);
      }
    }
  });

  return roots;
};
