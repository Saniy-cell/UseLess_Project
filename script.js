document.getElementById('Ingredient-Form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const ingredientsInput = document.getElementById('ingredients').value;
    const ingredients = ingredientsInput.split(',').map(ingredient => ingredient.trim());
    
    try {
        const response = await fetch('http://localhost:5000/suggest-recipes', { // Updated endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ ingredients })
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const recipes = await response.json();
        const recipesContainer = document.getElementById('Recipes'); // Corrected ID
        recipesContainer.innerHTML = '';

        if (recipes.length > 0) {
            recipes.forEach(recipe => {
                const recipeDiv = document.createElement('div');
                recipeDiv.textContent = recipe.name;
                recipesContainer.appendChild(recipeDiv);
            });
        } else {
            recipesContainer.textContent = 'No recipes found.';
        }
    } catch (error) {
        console.error('Fetch error:', error);
        const recipesContainer = document.getElementById('Recipes');
        recipesContainer.textContent = 'An error occurred while fetching recipes.';
    }
});
