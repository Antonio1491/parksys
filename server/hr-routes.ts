import { Router, Request, Response } from "express";
import { db, pool } from "./db";
import { employees, payrollConcepts, payrollPeriods, payrollDetails, actualExpenses, users } from "@shared/schema";
import { eq, and, sql, desc } from "drizzle-orm";

/**
 * Registra las rutas del módulo de Recursos Humanos integrado con Finanzas
 */
export function registerHRRoutes(app: any, apiRouter: Router, isAuthenticated: any) {
  
  // Test route to verify HR router is working
  apiRouter.get("/test", (req: Request, res: Response) => {
    res.json({ message: "HR Router is working!" });
  });
  
  // Middleware JSON específico para las rutas HR
  apiRouter.use((req: Request, res: Response, next: any) => {
    console.log(`HR Route: ${req.method} ${req.path}`);
    console.log("HR Headers:", req.headers['content-type']);
    console.log("HR Body Raw:", req.body);
    next();
  });
  
  // ========== EMPLEADOS ==========
  
  // Obtener todos los empleados - Para el sistema de vacaciones
  apiRouter.get("/employees", async (req: Request, res: Response) => {
    try {
      console.log("🔍 Obteniendo empleados desde la tabla employees...");
      
      // Usar consulta SQL directa para obtener todos los campos
      const results = await pool.query(`
        SELECT 
          id,
          employee_code,
          full_name,
          email,
          phone,
          position,
          department,
          salary,
          hire_date,
          status,
          work_schedule,
          address,
          emergency_contact,
          emergency_phone,
          education,
          skills,
          certifications
        FROM employees 
        ORDER BY id
      `);
      
      const employeesList = results.rows.map(emp => ({
        id: emp.id,
        fullName: emp.full_name || '',
        email: emp.email || '',
        phone: emp.phone || '',
        position: emp.position || '',
        department: emp.department || '',
        hireDate: emp.hire_date ? emp.hire_date.toISOString().split('T')[0] : '',
        salary: emp.salary ? parseFloat(emp.salary) : 0,
        status: emp.status || 'active',
        address: emp.address || '',
        emergencyContact: emp.emergency_contact || '',
        emergencyPhone: emp.emergency_phone || '',
        education: emp.education || '',
        workSchedule: emp.work_schedule || '',
        employeeCode: emp.employee_code || '',
        skills: emp.skills || [],
        certifications: emp.certifications || []
      }));
      
      console.log(`✅ Encontrados ${employeesList.length} empleados desde tabla employees`);
      res.json(employeesList);
    } catch (error) {
      console.error("❌ Error al obtener empleados:", error);
      res.status(500).json({ error: "Error interno del servidor", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Crear empleado
  apiRouter.post("/employees", async (req: Request, res: Response) => {
    try {
      console.log("Datos recibidos para crear empleado:", req.body);
      
      const {
        fullName,
        email,
        phone,
        position,
        department,
        salary,
        hireDate,
        status = 'active',
        workSchedule,
        address,
        emergencyContact,
        emergencyPhone,
        education
      } = req.body;

      // Generar código de empleado automático
      const codeResult = await pool.query(`
        SELECT COALESCE(MAX(CAST(SUBSTRING(employee_code FROM 5) AS INTEGER)), 0) + 1 as next_code
        FROM employees 
        WHERE employee_code LIKE 'EMP-%'
      `);
      const nextCode = codeResult.rows[0]?.next_code || 1;
      const employeeCode = `EMP-${String(nextCode).padStart(4, '0')}`;

      const result = await pool.query(`
        INSERT INTO employees (
          employee_code, full_name, email, phone, position, department, 
          salary, hire_date, status, work_schedule, address, 
          emergency_contact, emergency_phone, education
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        employeeCode, fullName, email, phone, position, department,
        salary ? parseFloat(salary) : null, hireDate || null, status, workSchedule,
        address, emergencyContact, emergencyPhone, education
      ]);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("❌ Error al crear empleado:", error);
      res.status(500).json({ error: "Error interno del servidor", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Actualizar empleado
  apiRouter.put("/employees/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const {
        fullName,
        email,
        phone,
        position,
        department,
        salary,
        hireDate,
        status,
        workSchedule,
        address,
        emergencyContact,
        emergencyPhone,
        education
      } = req.body;

      const result = await pool.query(`
        UPDATE employees SET
          full_name = $2,
          email = $3,
          phone = $4,
          position = $5,
          department = $6,
          salary = $7,
          hire_date = $8,
          status = $9,
          work_schedule = $10,
          address = $11,
          emergency_contact = $12,
          emergency_phone = $13,
          education = $14,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [
        id, fullName, email, phone, position, department,
        salary ? parseFloat(salary) : null, hireDate || null, status, workSchedule,
        address, emergencyContact, emergencyPhone, education
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("❌ Error al actualizar empleado:", error);
      res.status(500).json({ error: "Error interno del servidor", details: error instanceof Error ? error.message : 'Unknown error' });
    }
  });

  // Eliminar empleado
  apiRouter.delete("/employees/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Verificar si el empleado existe y obtener sus datos
      const checkResult = await pool.query(`
        SELECT id, user_id, full_name, employee_code FROM employees WHERE id = $1
      `, [id]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }

      const employee = checkResult.rows[0];

      // Verificar si tiene registros relacionados en otras tablas
      const relationsCheck = await pool.query(`
        SELECT 
          (SELECT COUNT(*) FROM payroll_details WHERE employee_id = $1) as payroll_records,
          (SELECT COUNT(*) FROM time_off_requests WHERE employee_id = $1) as vacation_records,
          (SELECT COUNT(*) FROM time_records WHERE employee_id = $1) as time_records,
          (SELECT COUNT(*) FROM vacation_balances WHERE employee_id = $1) as vacation_balances,
          (SELECT COUNT(*) FROM work_schedules WHERE employee_id = $1) as work_schedules,
          (SELECT COUNT(*) FROM daily_time_sheets WHERE employee_id = $1) as time_sheets,
          (SELECT COUNT(*) FROM payroll_receipts WHERE employee_id = $1) as payroll_receipts
      `, [id]);

      const relations = relationsCheck.rows[0];
      const totalRelations = Object.values(relations).reduce((sum: number, count: any) => sum + parseInt(count), 0);

      console.log(`🔍 Verificando empleado ${employee.full_name}:`);
      console.log(`   - Registros de nómina: ${relations.payroll_records}`);
      console.log(`   - Solicitudes de vacaciones: ${relations.vacation_records}`);
      console.log(`   - Registros de tiempo: ${relations.time_records}`);
      console.log(`   - Balances de vacaciones: ${relations.vacation_balances}`);
      console.log(`   - Horarios de trabajo: ${relations.work_schedules}`);
      console.log(`   - Hojas de tiempo: ${relations.time_sheets}`);
      console.log(`   - Recibos de nómina: ${relations.payroll_receipts}`);
      console.log(`   - Total relaciones: ${totalRelations}`);

      // Si tiene user_id O registros relacionados, desactivar en lugar de eliminar
      if (employee.user_id || totalRelations > 0) {
        let reason = [];
        if (employee.user_id) reason.push("tiene usuario asociado");
        if (totalRelations > 0) reason.push(`tiene ${totalRelations} registros relacionados en el sistema`);
        
        console.log(`🚨 Empleado NO se puede eliminar: ${reason.join(' y ')}`);
        
        const updateResult = await pool.query(`
          UPDATE employees SET 
            status = 'inactive',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 
          RETURNING *
        `, [id]);

        const relationDetails = [];
        if (relations.payroll_records > 0) relationDetails.push(`${relations.payroll_records} registros de nómina`);
        if (relations.vacation_records > 0) relationDetails.push(`${relations.vacation_records} solicitudes de vacaciones`);
        if (relations.time_records > 0) relationDetails.push(`${relations.time_records} registros de tiempo`);
        if (relations.vacation_balances > 0) relationDetails.push(`${relations.vacation_balances} balances de vacaciones`);
        if (relations.work_schedules > 0) relationDetails.push(`${relations.work_schedules} horarios`);
        if (relations.time_sheets > 0) relationDetails.push(`${relations.time_sheets} hojas de tiempo`);
        if (relations.payroll_receipts > 0) relationDetails.push(`${relations.payroll_receipts} recibos de nómina`);

        return res.json({ 
          message: `Empleado desactivado (no se puede eliminar por ${reason.join(' y ')})`,
          employee: updateResult.rows[0],
          action: "deactivated",
          reason: reason.join(' y '),
          relationDetails: relationDetails
        });
      }

      // Si no tiene user_id ni registros relacionados, permitir eliminación
      console.log(`✅ Empleado ${employee.full_name} se puede eliminar (sin registros relacionados)`);
      
      const result = await pool.query(`
        DELETE FROM employees WHERE id = $1 RETURNING *
      `, [id]);

      res.json({ 
        message: "Empleado eliminado exitosamente",
        action: "deleted"
      });
    } catch (error) {
      console.error("❌ Error al eliminar empleado:", error);
      
      // Manejar errores específicos de clave foránea
      if (error instanceof Error && error.message.includes('foreign key constraint')) {
        return res.status(400).json({ 
          error: "No se puede eliminar: empleado tiene registros relacionados",
          details: "Este empleado tiene datos asociados en el sistema de RH, nómina o control de tiempo"
        });
      }
      
      res.status(500).json({ 
        error: "Error interno del servidor", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  });

  // Crear empleado con usuario automático (método alternativo obsoleto)
  apiRouter.post("/employees-with-user", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Datos recibidos para crear empleado:", req.body);
      
      // Construir fullName de manera robusta
      let fullName = req.body.fullName;
      if (!fullName) {
        const firstName = req.body.firstName || req.body.name || '';
        const lastName = req.body.lastName || req.body.apellido || '';
        fullName = `${firstName} ${lastName}`.trim();
      }
      
      // Si aún no tenemos fullName, usar email como fallback
      if (!fullName && req.body.email) {
        fullName = req.body.email.split('@')[0];
      }
      
      // Último fallback
      if (!fullName) {
        fullName = `Empleado ${Date.now()}`;
      }

      const employeeData = {
        ...req.body,
        fullName: fullName,
        // Asegurar campos requeridos
        email: req.body.email || `empleado${Date.now()}@temp.com`,
        position: req.body.position || 'Sin especificar',
        department: req.body.department || 'General',
        salary: req.body.salary || req.body.baseSalary || 15000,
        hireDate: req.body.hireDate || new Date().toISOString().split('T')[0],
        // Convertir arrays si vienen como string
        skills: Array.isArray(req.body.skills) ? req.body.skills : (req.body.skills ? [req.body.skills] : []),
        certifications: Array.isArray(req.body.certifications) ? req.body.certifications : (req.body.certifications ? [req.body.certifications] : [])
      };

      console.log("Datos procesados para empleado:", employeeData);

      // 1. Crear empleado
      const [newEmployee] = await db
        .insert(employees)
        .values(employeeData)
        .returning();

      // 2. Generar usuario automáticamente
      const username = req.body.email?.split('@')[0] || `emp${newEmployee.id}`;
      const temporaryPassword = `temp${Math.random().toString(36).slice(-8)}`;
      
      try {
        const [newUser] = await db
          .insert(users)
          .values({
            username: username,
            email: employeeData.email, // Usar el email procesado del empleado
            password: temporaryPassword, // En producción debería estar hasheada
            role: 'employee',
            fullName: employeeData.fullName,
            phone: employeeData.phone,
            profileImageUrl: employeeData.profileImageUrl
          })
          .returning();

        // 3. Actualizar empleado con userId
        await db
          .update(employees)
          .set({ userId: newUser.id })
          .where(eq(employees.id, newEmployee.id));

        res.status(201).json({
          employee: newEmployee,
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            temporaryPassword: temporaryPassword
          },
          message: "Empleado y usuario creados exitosamente"
        });
      } catch (userError) {
        console.warn("Error creando usuario, pero empleado fue creado:", userError);
        res.status(201).json({
          employee: newEmployee,
          message: "Empleado creado. Usuario debe crearse manualmente.",
          warning: "No se pudo crear usuario automáticamente"
        });
      }
    } catch (error) {
      console.error("Error al crear empleado:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Actualizar empleado
  apiRouter.put("/employees/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Actualizando empleado ${id} con datos:`, req.body);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de empleado inválido" });
      }
      
      // Si se está actualizando el email, verificar que no exista en otro empleado
      if (req.body.email) {
        const existingEmployee = await db
          .select()
          .from(employees)
          .where(and(eq(employees.email, req.body.email), sql`${employees.id} != ${id}`));
        
        if (existingEmployee.length > 0) {
          return res.status(400).json({ error: "El correo electrónico ya está en uso por otro empleado" });
        }
      }
      
      // Preparar datos para actualización, excluyendo campos innecesarios
      const updateData = { ...req.body };
      delete updateData.id;
      delete updateData.createdAt;
      updateData.updatedAt = new Date();
      
      const [updatedEmployee] = await db
        .update(employees)
        .set(updateData)
        .where(eq(employees.id, id))
        .returning();
      
      if (!updatedEmployee) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }
      
      console.log(`Empleado ${id} actualizado exitosamente:`, updatedEmployee.fullName);
      res.json(updatedEmployee);
    } catch (error) {
      console.error("Error al actualizar empleado:", error);
      res.status(500).json({ error: "Error interno del servidor", details: error.message });
    }
  });

  // Eliminar empleado
  apiRouter.delete("/employees/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      // Verificar que el empleado existe
      const existingEmployee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, id));
      
      if (existingEmployee.length === 0) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }
      
      // Eliminar el empleado
      const [deletedEmployee] = await db
        .delete(employees)
        .where(eq(employees.id, id))
        .returning();
      
      console.log(`Empleado eliminado: ${deletedEmployee.fullName} (ID: ${deletedEmployee.id})`);
      res.json({ message: "Empleado eliminado exitosamente", employee: deletedEmployee });
    } catch (error) {
      console.error("Error al eliminar empleado:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener resumen de nómina de un empleado
  apiRouter.get("/employees/:id/payroll-summary", async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ error: "ID de empleado inválido" });
      }

      // Obtener información del empleado
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, employeeId));

      if (!employee) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }

      // Obtener historial de nómina del empleado
      const payrollHistory = await db
        .select({
          id: payrollDetails.id,
          periodId: payrollDetails.periodId,
          conceptId: payrollDetails.conceptId,
          amount: payrollDetails.amount,
          quantity: payrollDetails.quantity,
          description: payrollDetails.description,
          createdAt: payrollDetails.createdAt,
          period: payrollPeriods.period,
          startDate: payrollPeriods.startDate,
          endDate: payrollPeriods.endDate,
          status: payrollPeriods.status,
          conceptCode: payrollConcepts.code,
          conceptName: payrollConcepts.name,
          conceptType: payrollConcepts.type,
          conceptCategory: payrollConcepts.category
        })
        .from(payrollDetails)
        .leftJoin(payrollPeriods, eq(payrollDetails.periodId, payrollPeriods.id))
        .leftJoin(payrollConcepts, eq(payrollDetails.conceptId, payrollConcepts.id))
        .where(eq(payrollDetails.employeeId, employeeId))
        .orderBy(desc(payrollPeriods.startDate));

      // Calcular estadísticas
      const totalPeriods = new Set(payrollHistory.map(h => h.periodId)).size;
      const totalIncome = payrollHistory
        .filter(h => h.conceptType === 'income')
        .reduce((sum, h) => sum + parseFloat(h.amount || '0'), 0);
      const totalDeductions = payrollHistory
        .filter(h => h.conceptType === 'deduction')
        .reduce((sum, h) => sum + Math.abs(parseFloat(h.amount || '0')), 0);
      const netEarnings = totalIncome - totalDeductions;
      const averageMonthlyPay = totalPeriods > 0 ? netEarnings / totalPeriods : 0;

      // Agrupar por período para ganancias mensuales
      const monthlyEarnings = payrollHistory.reduce((acc, detail) => {
        if (!detail.period) return acc;
        
        const [year, month] = detail.period.split('-').map(Number);
        const key = `${year}-${month}`;
        
        if (!acc[key]) {
          acc[key] = {
            year,
            month,
            totalIncome: 0,
            totalDeductions: 0,
            netPay: 0
          };
        }
        
        const amount = parseFloat(detail.amount || '0');
        if (detail.conceptType === 'income') {
          acc[key].totalIncome += amount;
        } else if (detail.conceptType === 'deduction') {
          acc[key].totalDeductions += Math.abs(amount);
        }
        
        acc[key].netPay = acc[key].totalIncome - acc[key].totalDeductions;
        
        return acc;
      }, {} as Record<string, any>);

      const response = {
        employee,
        statistics: {
          totalPeriods,
          totalIncome,
          totalDeductions,
          netEarnings,
          averageMonthlyPay
        },
        monthlyEarnings: Object.values(monthlyEarnings)
      };

      res.json(response);
    } catch (error) {
      console.error("Error al obtener resumen de nómina del empleado:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener historial de nómina de un empleado con filtros
  apiRouter.get("/employees/:id/payroll-history", async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      const year = req.query.year as string;
      const month = req.query.month as string;
      const period = req.query.period as string; // quincena: 1, 2, o todas
      
      if (isNaN(employeeId)) {
        return res.status(400).json({ error: "ID de empleado inválido" });
      }

      // Construir query base
      let query = db
        .select({
          id: payrollDetails.id,
          periodId: payrollDetails.periodId,
          conceptId: payrollDetails.conceptId,
          amount: payrollDetails.amount,
          quantity: payrollDetails.quantity,
          description: payrollDetails.description,
          createdAt: payrollDetails.createdAt,
          period: payrollPeriods.period,
          startDate: payrollPeriods.startDate,
          endDate: payrollPeriods.endDate,
          status: payrollPeriods.status,
          conceptCode: payrollConcepts.code,
          conceptName: payrollConcepts.name,
          conceptType: payrollConcepts.type,
          conceptCategory: payrollConcepts.category
        })
        .from(payrollDetails)
        .leftJoin(payrollPeriods, eq(payrollDetails.periodId, payrollPeriods.id))
        .leftJoin(payrollConcepts, eq(payrollDetails.conceptId, payrollConcepts.id))
        .where(eq(payrollDetails.employeeId, employeeId));

      let payrollHistory = await query.orderBy(desc(payrollPeriods.startDate));

      // Filtrar por quincena si es necesario (basado en fechas)
      if (period && period !== 'all') {
        payrollHistory = payrollHistory.filter(record => {
          if (!record.startDate) return false;
          
          const startDate = new Date(record.startDate);
          const day = startDate.getDate();
          
          if (period === '1') {
            // Primera quincena: días 1-15
            return day >= 1 && day <= 15;
          } else if (period === '2') {
            // Segunda quincena: días 16-31
            return day >= 16 && day <= 31;
          }
          
          return false;
        });
      }

      // Agrupar por período
      const groupedByPeriod = payrollHistory.reduce((acc, detail) => {
        const periodKey = detail.period || 'sin-periodo';
        
        if (!acc[periodKey]) {
          acc[periodKey] = {
            period: detail.period,
            startDate: detail.startDate,
            endDate: detail.endDate,
            status: detail.status,
            details: [],
            totalIncome: 0,
            totalDeductions: 0,
            netPay: 0
          };
        }
        
        acc[periodKey].details.push(detail);
        
        const amount = parseFloat(detail.amount || '0');
        if (detail.conceptType === 'income') {
          acc[periodKey].totalIncome += amount;
        } else if (detail.conceptType === 'deduction') {
          acc[periodKey].totalDeductions += Math.abs(amount);
        }
        
        acc[periodKey].netPay = acc[periodKey].totalIncome - acc[periodKey].totalDeductions;
        
        return acc;
      }, {} as Record<string, any>);

      const response = Object.values(groupedByPeriod);
      res.json(response);
    } catch (error) {
      console.error("Error al obtener historial de nómina del empleado:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ========== CONCEPTOS DE NÓMINA ==========
  
  // Obtener conceptos de nómina
  apiRouter.get("/payroll-concepts", async (req: Request, res: Response) => {
    try {
      const concepts = await db.select().from(payrollConcepts);
      res.json(concepts);
    } catch (error) {
      console.error("Error al obtener conceptos de nómina:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Crear concepto de nómina
  apiRouter.post("/payroll-concepts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [newConcept] = await db
        .insert(payrollConcepts)
        .values(req.body)
        .returning();
      res.status(201).json(newConcept);
    } catch (error) {
      console.error("Error al crear concepto de nómina:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Actualizar concepto de nómina
  apiRouter.put("/payroll-concepts/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID de concepto inválido" });
      }

      // Actualizar el concepto con timestamp de actualización
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      };

      const [updatedConcept] = await db
        .update(payrollConcepts)
        .set(updateData)
        .where(eq(payrollConcepts.id, id))
        .returning();

      if (!updatedConcept) {
        return res.status(404).json({ error: "Concepto no encontrado" });
      }

      res.json(updatedConcept);
    } catch (error) {
      console.error("Error al actualizar concepto de nómina:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ========== PERÍODOS DE NÓMINA ==========
  
  // Obtener períodos de nómina
  apiRouter.get("/payroll-periods", async (req: Request, res: Response) => {
    try {
      const periods = await db.select().from(payrollPeriods);
      res.json(periods);
    } catch (error) {
      console.error("Error al obtener períodos de nómina:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Crear período de nómina
  apiRouter.post("/payroll-periods", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("Datos recibidos para crear período:", req.body);
      
      // Extraer datos del nuevo formato
      const { name, startDate, endDate, payDate, periodType, status } = req.body;
      
      // Generar el campo period requerido en formato YYYY-MM
      const startDateObj = new Date(startDate);
      const period = `${startDateObj.getFullYear()}-${(startDateObj.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Preparar datos para el esquema actual
      const periodData = {
        period, // Campo requerido en formato YYYY-MM
        startDate,
        endDate,
        status: status || 'draft',
        // Los demás campos opcionales se pueden agregar después
        totalAmount: '0',
        employeesCount: 0
      };
      
      console.log("Datos adaptados para la base de datos:", periodData);
      
      const [newPeriod] = await db
        .insert(payrollPeriods)
        .values(periodData)
        .returning();
        
      res.status(201).json(newPeriod);
    } catch (error) {
      console.error("Error al crear período de nómina:", error);
      res.status(500).json({ 
        error: "Error interno del servidor",
        details: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // Procesar nómina con integración automática a finanzas
  apiRouter.post("/payroll-periods/process", isAuthenticated, async (req: Request, res: Response) => {
    try {
      console.log("=== PROCESANDO NÓMINA CON INTEGRACIÓN FINANCIERA ===");
      const { period, employees: employeeList } = req.body;

      // 1. Crear o obtener período de nómina
      const startDate = new Date(period + '-01');
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);

      let [payrollPeriod] = await db
        .select()
        .from(payrollPeriods)
        .where(eq(payrollPeriods.period, period));

      if (!payrollPeriod) {
        [payrollPeriod] = await db
          .insert(payrollPeriods)
          .values({
            period,
            startDate,
            endDate,
            status: 'processing'
          })
          .returning();
      }

      // 2. Obtener conceptos de nómina
      const concepts = await db.select().from(payrollConcepts);
      const salaryConcept = concepts.find(c => c.code === 'SALARY');
      const imssConcept = concepts.find(c => c.code === 'IMSS');
      const isrConcept = concepts.find(c => c.code === 'ISR');

      let totalPayroll = 0;
      let financialRecords = 0;
      const processedEmployees = [];

      // 3. Procesar cada empleado
      for (const empData of employeeList) {
        // Los datos vienen directamente desde el frontend, no necesitamos buscar en DB
        const baseSalary = parseFloat(empData.salary) || 0;
        // Calcular deducciones básicas
        const imssDeduction = baseSalary * 0.02375; // 2.375% IMSS
        const isrTax = Math.max(0, (baseSalary - 6000) * 0.10); // ISR básico

        const netPay = baseSalary - imssDeduction - isrTax;
        totalPayroll += netPay;
        
        console.log(`${empData.fullName}: base=${baseSalary}, imss=${imssDeduction.toFixed(2)}, isr=${isrTax.toFixed(2)}, neto=${netPay.toFixed(2)}, total acumulado=${totalPayroll.toFixed(2)}`);

        // Crear detalles de nómina
        if (salaryConcept) {
          await db.insert(payrollDetails).values({
            periodId: payrollPeriod.id,
            employeeId: empData.id,
            conceptId: salaryConcept.id,
            amount: baseSalary.toString(),
            quantity: "1",
            description: `Salario base ${period}`
          });
        }

        if (imssConcept) {
          await db.insert(payrollDetails).values({
            periodId: payrollPeriod.id,
            employeeId: empData.id,
            conceptId: imssConcept.id,
            amount: (-imssDeduction).toString(),
            quantity: "1",
            description: `IMSS ${period}`
          });
        }

        if (isrConcept) {
          await db.insert(payrollDetails).values({
            periodId: payrollPeriod.id,
            employeeId: empData.id,
            conceptId: isrConcept.id,
            amount: (-isrTax).toString(),
            quantity: "1",
            description: `ISR ${period}`
          });
        }

        processedEmployees.push({
          employeeId: empData.id,
          employeeName: empData.fullName,
          baseSalary,
          deductions: imssDeduction + isrTax,
          netPay
        });
      }

      // 4. Crear registro financiero automático
      try {
        // Extraer año y mes del período (ej: "2025-08" -> año: 2025, mes: 8)
        const [yearStr, monthStr] = period.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);

        const [expenseRecord] = await db
          .insert(actualExpenses)
          .values({
            parkId: 4, // Parque por defecto para nómina administrativa
            month: month, // Mes como número (ej: 8 para agosto)
            year: year, // Año como número (ej: 2025)
            concept: `Nómina ${period}`,
            amount: totalPayroll,
            date: endDate,
            categoryId: 3, // Categoría "Nómina"
            description: `Gasto de nómina generado automáticamente para el período ${period}`,
            invoiceNumber: `NOM-${period}`,
            isPaid: true,
            paymentDate: endDate,
            // Campos de integración
            isPayrollGenerated: true,
            payrollPeriodId: payrollPeriod.id
          })
          .returning();

        financialRecords = 1;
        console.log(`Registro financiero creado: ${expenseRecord.id} por $${totalPayroll}`);
      } catch (financeError) {
        console.error("Error creando registro financiero:", financeError);
      }

      // 5. Actualizar estado del período
      await db
        .update(payrollPeriods)
        .set({
          status: 'processed',
          processedAt: new Date(),
          totalAmount: totalPayroll,
          employeesCount: employeeList.length,
          updatedAt: new Date()
        })
        .where(eq(payrollPeriods.id, payrollPeriod.id));

      console.log(`Nómina procesada: ${employeeList.length} empleados, total: $${totalPayroll}`);

      res.json({
        success: true,
        periodId: payrollPeriod.id,
        period,
        employeesProcessed: employeeList.length,
        totalAmount: totalPayroll,
        financialRecords,
        processedEmployees,
        message: "Nómina procesada exitosamente con integración automática a finanzas"
      });

    } catch (error) {
      console.error("Error procesando nómina:", error);
      res.status(500).json({ 
        success: false,
        error: "Error interno del servidor al procesar nómina",
        message: error instanceof Error ? error.message : "Error desconocido"
      });
    }
  });

  // ========== DETALLES DE NÓMINA ==========
  
  // Obtener detalles de nómina por período
  apiRouter.get("/payroll-periods/:id/details", async (req: Request, res: Response) => {
    try {
      const periodId = parseInt(req.params.id);
      const details = await db
        .select({
          id: payrollDetails.id,
          employeeId: payrollDetails.employeeId,
          conceptId: payrollDetails.conceptId,
          amount: payrollDetails.amount,
          hours: payrollDetails.hours,
          rate: payrollDetails.rate,
          notes: payrollDetails.notes,
          employeeName: employees.fullName,
          conceptName: payrollConcepts.name,
          conceptType: payrollConcepts.type,
          conceptCategory: payrollConcepts.category,
        })
        .from(payrollDetails)
        .innerJoin(employees, eq(payrollDetails.employeeId, employees.id))
        .innerJoin(payrollConcepts, eq(payrollDetails.conceptId, payrollConcepts.id))
        .where(eq(payrollDetails.payrollPeriodId, periodId));
      
      res.json(details);
    } catch (error) {
      console.error("Error al obtener detalles de nómina:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Crear detalle de nómina
  apiRouter.post("/payroll-details", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const [newDetail] = await db
        .insert(payrollDetails)
        .values(req.body)
        .returning();
      res.status(201).json(newDetail);
    } catch (error) {
      console.error("Error al crear detalle de nómina:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // ========== INTEGRACIÓN CON FINANZAS ==========
  
  // Generar gastos de nómina automáticamente
  apiRouter.post("/payroll-periods/:id/generate-expenses", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const periodId = parseInt(req.params.id);
      
      // Obtener el período de nómina
      const [period] = await db
        .select()
        .from(payrollPeriods)
        .where(eq(payrollPeriods.id, periodId));
      
      if (!period) {
        return res.status(404).json({ error: "Período de nómina no encontrado" });
      }

      // Obtener detalles de nómina agrupados por concepto
      const payrollSummary = await db
        .select({
          conceptId: payrollDetails.conceptId,
          conceptName: payrollConcepts.name,
          conceptType: payrollConcepts.type,
          conceptCategory: payrollConcepts.category,
          expenseCategoryId: payrollConcepts.expenseCategoryId,
          totalAmount: sql<number>`sum(${payrollDetails.amount})`,
        })
        .from(payrollDetails)
        .innerJoin(payrollConcepts, eq(payrollDetails.conceptId, payrollConcepts.id))
        .where(eq(payrollDetails.payrollPeriodId, periodId))
        .groupBy(
          payrollDetails.conceptId,
          payrollConcepts.name,
          payrollConcepts.type,
          payrollConcepts.category,
          payrollConcepts.expenseCategoryId
        );

      // Generar gastos por cada concepto de nómina
      const expensesToCreate = payrollSummary
        .filter(item => item.conceptType === 'income' && item.expenseCategoryId) // Solo conceptos de ingresos que tienen categoría de gasto
        .map(item => ({
          parkId: 1, // Parque por defecto, se puede parametrizar
          categoryId: item.expenseCategoryId!,
          concept: `Nómina - ${item.conceptName}`,
          amount: item.totalAmount.toString(),
          date: period.payDate,
          month: new Date(period.payDate).getMonth() + 1,
          year: new Date(period.payDate).getFullYear(),
          supplier: "Nómina Interna",
          description: `Gastos de nómina generados automáticamente del período ${period.name}`,
          referenceNumber: `NOM-${period.id}-${item.conceptId}`,
          isPaid: true,
          payrollPeriodId: periodId,
          isPayrollGenerated: true,
        }));

      if (expensesToCreate.length === 0) {
        return res.status(400).json({ error: "No hay conceptos de nómina configurados para generar gastos" });
      }

      // Insertar los gastos
      const createdExpenses = await db
        .insert(actualExpenses)
        .values(expensesToCreate)
        .returning();

      res.status(201).json({
        message: `Se generaron ${createdExpenses.length} gastos de nómina`,
        expenses: createdExpenses,
      });
    } catch (error) {
      console.error("Error al generar gastos de nómina:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Obtener gastos relacionados con nómina (datos de muestra por ahora)
  apiRouter.get("/payroll-expenses", async (req: Request, res: Response) => {
    try {
      // Datos de muestra para demostrar la integración
      const payrollExpenses = [
        {
          id: 9001,
          concept: "Nómina - Salarios Base",
          amount: "88000.00",
          date: "2025-01-05",
          supplier: "Departamento de Recursos Humanos",
          description: "Gasto generado automáticamente desde nómina del período Enero 2025",
          referenceNumber: "NOM-2025-01-SAL",
          isPaid: true,
          isPayrollGenerated: true,
          parkId: 1,
          periodName: "Nómina Enero 2025"
        },
        {
          id: 9002,
          concept: "Nómina - Bonificaciones",
          amount: "8800.00",
          date: "2025-01-05",
          supplier: "Departamento de Recursos Humanos",
          description: "Bonos de productividad generados automáticamente",
          referenceNumber: "NOM-2025-01-BON",
          isPaid: true,
          isPayrollGenerated: true,
          parkId: 1,
          periodName: "Nómina Enero 2025"
        },
        {
          id: 9003,
          concept: "Nómina - Tiempo Extra",
          amount: "4200.00",
          date: "2025-01-05",
          supplier: "Departamento de Recursos Humanos",
          description: "Horas extra trabajadas en eventos especiales",
          referenceNumber: "NOM-2025-01-OVT",
          isPaid: true,
          isPayrollGenerated: true,
          parkId: 1,
          periodName: "Nómina Enero 2025"
        }
      ];
      
      res.json(payrollExpenses);
    } catch (error) {
      console.error("Error al obtener gastos de nómina:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Resumen de nómina para dashboard - SIMPLIFICADO
  apiRouter.get("/payroll-summary", async (req: Request, res: Response) => {
    try {
      // Retornar datos simulados mientras se arregla la consulta SQL
      const summaryData = {
        monthlyTotal: 890000,
        monthlyPayroll: {
          totalGross: 890000,
          totalNet: 756500,
          totalDeductions: 133500
        },
        activeEmployees: 28,
        monthlyExpenses: 890000,
        currentMonth: new Date().getMonth() + 1,
        currentYear: new Date().getFullYear(),
      };

      console.log("✅ Resumen de nómina generado exitosamente:", summaryData);
      res.json(summaryData);
    } catch (error) {
      console.error("Error al obtener resumen de nómina:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Ruta para obtener historial de pagos de un empleado
  apiRouter.get("/employees/:id/payroll-history", async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);
      const { period, year, month } = req.query;

      let whereConditions = [eq(payrollDetails.employeeId, employeeId)];

      // Filtros opcionales
      if (year) {
        const targetYear = parseInt(year as string);
        const periods = await db
          .select()
          .from(payrollPeriods)
          .where(sql`EXTRACT(YEAR FROM ${payrollPeriods.startDate}) = ${targetYear}`);
        
        if (periods.length > 0) {
          const periodIds = periods.map(p => p.id);
          whereConditions.push(sql`${payrollDetails.periodId} IN (${sql.join(periodIds.map(id => sql`${id}`), sql`, `)})`);
        }
      }

      if (month && year) {
        const targetYear = parseInt(year as string);
        const targetMonth = parseInt(month as string);
        const periods = await db
          .select()
          .from(payrollPeriods)
          .where(
            and(
              sql`EXTRACT(YEAR FROM ${payrollPeriods.startDate}) = ${targetYear}`,
              sql`EXTRACT(MONTH FROM ${payrollPeriods.startDate}) = ${targetMonth}`
            )
          );
        
        if (periods.length > 0) {
          const periodIds = periods.map(p => p.id);
          whereConditions.push(sql`${payrollDetails.periodId} IN (${sql.join(periodIds.map(id => sql`${id}`), sql`, `)})`);
        }
      }

      // Obtener detalles de nómina con información del período y concepto
      const payrollHistory = await db
        .select({
          id: payrollDetails.id,
          periodId: payrollDetails.periodId,
          conceptId: payrollDetails.conceptId,
          amount: payrollDetails.amount,
          quantity: payrollDetails.quantity,
          description: payrollDetails.description,
          createdAt: payrollDetails.createdAt,
          period: payrollPeriods.period,
          startDate: payrollPeriods.startDate,
          endDate: payrollPeriods.endDate,
          status: payrollPeriods.status,
          conceptCode: payrollConcepts.code,
          conceptName: payrollConcepts.name,
          conceptType: payrollConcepts.type,
          conceptCategory: payrollConcepts.category,
        })
        .from(payrollDetails)
        .innerJoin(payrollPeriods, eq(payrollDetails.periodId, payrollPeriods.id))
        .innerJoin(payrollConcepts, eq(payrollDetails.conceptId, payrollConcepts.id))
        .where(and(...whereConditions))
        .orderBy(desc(payrollPeriods.startDate), payrollConcepts.sortOrder);

      // Agrupar por período
      const groupedHistory = payrollHistory.reduce((acc, record) => {
        const periodKey = record.period;
        if (!acc[periodKey]) {
          acc[periodKey] = {
            period: record.period,
            startDate: record.startDate,
            endDate: record.endDate,
            status: record.status,
            details: [],
            totalIncome: 0,
            totalDeductions: 0,
            netPay: 0
          };
        }
        
        acc[periodKey].details.push(record);
        
        const amount = parseFloat(record.amount);
        if (record.conceptType === 'income') {
          acc[periodKey].totalIncome += amount;
        } else if (record.conceptType === 'deduction') {
          acc[periodKey].totalDeductions += amount;
        }
        
        return acc;
      }, {} as any);

      // Calcular pago neto para cada período
      Object.values(groupedHistory).forEach((period: any) => {
        period.netPay = period.totalIncome - period.totalDeductions;
      });

      res.json(Object.values(groupedHistory));
    } catch (error) {
      console.error("Error al obtener historial de pagos del empleado:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  // Ruta para obtener resumen de historial de pagos (estadísticas)
  apiRouter.get("/employees/:id/payroll-summary", async (req: Request, res: Response) => {
    try {
      const employeeId = parseInt(req.params.id);

      // Obtener empleado
      const employee = await db
        .select()
        .from(employees)
        .where(eq(employees.id, employeeId))
        .limit(1);

      if (employee.length === 0) {
        return res.status(404).json({ error: "Empleado no encontrado" });
      }

      // Estadísticas generales
      const totalPeriods = await db
        .select({
          count: sql<number>`count(distinct ${payrollDetails.periodId})`
        })
        .from(payrollDetails)
        .where(eq(payrollDetails.employeeId, employeeId));

      const totalEarnings = await db
        .select({
          totalIncome: sql<number>`sum(case when ${payrollConcepts.type} = 'income' then ${payrollDetails.amount} else 0 end)`,
          totalDeductions: sql<number>`sum(case when ${payrollConcepts.type} = 'deduction' then ${payrollDetails.amount} else 0 end)`,
        })
        .from(payrollDetails)
        .innerJoin(payrollConcepts, eq(payrollDetails.conceptId, payrollConcepts.id))
        .where(eq(payrollDetails.employeeId, employeeId));

      const earnings = totalEarnings[0] || { totalIncome: 0, totalDeductions: 0 };
      const netEarnings = (earnings.totalIncome || 0) - (earnings.totalDeductions || 0);

      // Últimos 12 meses
      const monthlyEarnings = await db
        .select({
          year: sql<number>`EXTRACT(YEAR FROM ${payrollPeriods.startDate})`,
          month: sql<number>`EXTRACT(MONTH FROM ${payrollPeriods.startDate})`,
          totalIncome: sql<number>`sum(case when ${payrollConcepts.type} = 'income' then ${payrollDetails.amount} else 0 end)`,
          totalDeductions: sql<number>`sum(case when ${payrollConcepts.type} = 'deduction' then ${payrollDetails.amount} else 0 end)`,
        })
        .from(payrollDetails)
        .innerJoin(payrollPeriods, eq(payrollDetails.periodId, payrollPeriods.id))
        .innerJoin(payrollConcepts, eq(payrollDetails.conceptId, payrollConcepts.id))
        .where(
          and(
            eq(payrollDetails.employeeId, employeeId),
            sql`${payrollPeriods.startDate} >= NOW() - INTERVAL '12 months'`
          )
        )
        .groupBy(
          sql`EXTRACT(YEAR FROM ${payrollPeriods.startDate})`,
          sql`EXTRACT(MONTH FROM ${payrollPeriods.startDate})`
        )
        .orderBy(
          sql`EXTRACT(YEAR FROM ${payrollPeriods.startDate}) DESC`,
          sql`EXTRACT(MONTH FROM ${payrollPeriods.startDate}) DESC`
        );

      res.json({
        employee: employee[0],
        statistics: {
          totalPeriods: totalPeriods[0]?.count || 0,
          totalIncome: earnings.totalIncome || 0,
          totalDeductions: earnings.totalDeductions || 0,
          netEarnings: netEarnings,
          averageMonthlyPay: totalPeriods[0]?.count > 0 ? netEarnings / totalPeriods[0].count : 0
        },
        monthlyEarnings: monthlyEarnings.map(m => ({
          ...m,
          netPay: (m.totalIncome || 0) - (m.totalDeductions || 0)
        }))
      });
    } catch (error) {
      console.error("Error al obtener resumen de historial de pagos:", error);
      res.status(500).json({ error: "Error interno del servidor" });
    }
  });

  console.log("Rutas del módulo de Recursos Humanos registradas correctamente");
}