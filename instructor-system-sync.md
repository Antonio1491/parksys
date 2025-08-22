# Instructor System Synchronization Report

## Critical Issues Found

### 1. **Form-Database Field Mismatches**

#### Missing Fields in Forms:
- `age` (integer) - Should add age input
- `gender` (text) - Should add gender selector
- `address` (text) - Should add address field  
- `availableDays` (text[]) - Forms only have `availability` string
- `availableHours` (text) - Missing time availability
- `certifications` (text[]) - No certification management
- `education` (text) - Missing education field

#### Field Mapping Issues:
- Form `experience` field maps to DB `bio` field incorrectly
- Form `availability` (string) should map to DB `availableDays` (array)

### 2. **Server Route Issues**

#### Missing Field Processing:
- `availableDays` not properly handled as array
- `certifications` array not processed  
- `education` field not handled
- Need to map form `availability` to `availableDays`

### 3. **Required Actions**

#### Update Forms:
1. Add missing demographic fields (age, gender, address)
2. Convert availability from string to day selection array
3. Add education and certifications management
4. Fix experience/bio field mapping

#### Update Server Routes:
1. Process `availableDays` as array from form data
2. Add `certifications` array processing
3. Handle `education` field properly
4. Map form fields correctly to database schema

#### Database Considerations:
- All fields exist in schema - no DB changes needed
- Validation schemas need updates for new fields

## Recommended Implementation Priority:

1. **HIGH**: Fix experience/bio field mapping
2. **HIGH**: Add availability days as array selection
3. **MEDIUM**: Add demographic fields (age, gender, address)
4. **MEDIUM**: Add education and certifications
5. **LOW**: Add available hours time picker
