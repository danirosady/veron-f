/**
 * @typedef {Object} User
 * @property {number} id
 * @property {string} name
 * @property {string} email
 * @property {string} role - 'superadmin' | 'admin_company'
 * @property {number} [company_id]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} Company
 * @property {number} id
 * @property {string} name
 * @property {string} [code]
 * @property {string} [address]
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [contact_person]
 * @property {string} [status] - 'active' | 'inactive'
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} Project
 * @property {number} id
 * @property {string} name
 * @property {number} company_id
 * @property {string} [description]
 * @property {string} [location]
 * @property {string} [status] - 'active' | 'inactive' | 'completed'
 * @property {string} [start_date]
 * @property {string} [end_date]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {Company} [company]
 */

/**
 * @typedef {Object} Unit
 * @property {number} id
 * @property {string} plate_number
 * @property {number} company_id
 * @property {number} project_id
 * @property {number} [driver_id]
 * @property {string} vehicle_type
 * @property {string} [brand]
 * @property {string} [model]
 * @property {number} [hm_initial]
 * @property {number} [hm_current]
 * @property {string} [status] - 'active' | 'inactive' | 'maintenance'
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {Company} [company]
 * @property {Project} [project]
 * @property {Driver} [driver]
 * @property {Tyre[]} [tyres]
 */

/**
 * @typedef {Object} Driver
 * @property {number} id
 * @property {string} name
 * @property {string} [employee_id]
 * @property {number} company_id
 * @property {number} [project_id]
 * @property {string} [phone]
 * @property {string} [license_number]
 * @property {string} [status] - 'active' | 'inactive'
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {Company} [company]
 * @property {Project} [project]
 */

/**
 * @typedef {Object} Tyre
 * @property {number} id
 * @property {string} serial_number
 * @property {string} tyre_size
 * @property {string} tyre_pattern
 * @property {string} brand
 * @property {number} [depth_new]
 * @property {number} [depth_current]
 * @property {number} [rtds]
 * @property {number} [cost]
 * @property {string} [purchase_date]
 * @property {string} [status] - 'new_tyre' | 'mounted' | 'spare' | 'dismounted' | 'repair' | 'scrap'
 * @property {number} [unit_id]
 * @property {number} [company_id]
 * @property {string} [position]
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {Unit} [unit]
 */

/**
 * @typedef {Object} Replacement
 * @property {number} id
 * @property {number} unit_id
 * @property {number} old_tyre_id
 * @property {number} new_tyre_id
 * @property {number} [driver_id]
 * @property {number} operator_id
 * @property {string} position
 * @property {number} old_tyre_hm
 * @property {number} new_tyre_hm
 * @property {string} [old_tyre_condition]
 * @property {string} [remarks]
 * @property {string} replacement_date
 * @property {string} [created_at]
 * @property {string} [updated_at]
 * @property {Unit} [unit]
 * @property {Tyre} [old_tyre]
 * @property {Tyre} [new_tyre]
 * @property {Driver} [driver]
 */

/**
 * @typedef {Object} MasterItem
 * @property {number} id
 * @property {string} name
 * @property {string} [code]
 * @property {string} [description]
 * @property {string} type - 'tyre_size' | 'tyre_pattern' | 'brand' | 'vehicle_type' | 'position'
 * @property {string} [status] - 'active' | 'inactive'
 * @property {string} [created_at]
 * @property {string} [updated_at]
 */

/**
 * @typedef {Object} PaginationMeta
 * @property {number} current_page
 * @property {number} last_page
 * @property {number} per_page
 * @property {number} total
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {any[]} data
 * @property {PaginationMeta} meta
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message
 * @property {Object.<string, string[]>} [errors]
 */

export {};
