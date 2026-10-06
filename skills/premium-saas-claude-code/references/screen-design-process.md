# Screen Design Process (Every Screen)

Use this exact sequence. Do not skip steps.

1. **Purpose**  
   Write one sentence: “User sees X and can do Y.”

2. **Elements**  
   List every required element (title, filters, table, primary CTA, empty state, etc.).

3. **Structure**  
   Decide hierarchy before visual design. What must be seen first?

4. **States First**  
   Design in this order:
   - Empty state
   - Loading state (skeleton)
   - Error state
   - Success / full content state
   - Edge cases (max content, no permissions, etc.)

5. **Build from System**  
   Use only components that already exist in the design system. Create a new component only if it will be reused.

6. **Hierarchy Test**  
   Squint at the screen or blur it. The most important action must still be the most visible.

7. **5-Second Rule**  
   Would a brand-new user know what to do in five seconds? If not → simplify.

8. **Role Check**  
   Confirm the screen is appropriate for the roles that can access it. Hide or simplify for lower-privilege roles.

## Common Mistakes to Catch
- Primary action buried in a menu
- Too many competing visual weights
- Missing empty or error states
- Inconsistent spacing or button styles
- Information density that overwhelms instead of informs
