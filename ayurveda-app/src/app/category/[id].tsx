// src/app/category/[id].tsx
// Simply re-exports the Products screen — category_id is passed via useLocalSearchParams
// The products/index.tsx already reads params.id as categoryId
 
export { default } from '../products/index'