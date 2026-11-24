# agents.py

from langchain.agents import AgentType, create_react_agent, AgentExecutor
from langchain.tools import Tool
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain.memory import ConversationBufferMemory
from langchain_community.tools import DuckDuckGoSearchRun
from langchain.chains.summarize import load_summarize_chain
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import WebBaseLoader

from typing import Dict, List, Any
import json
import random
from datetime import datetime, timedelta
import os

DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

HEALTH_GUIDE = {
    "diabetes": "Diabetes-friendly: low glycaemic index, prefer whole grains and millets (jowar, bajra, ragi, brown rice, whole wheat), "
                "plenty of vegetables and protein, avoid refined flour, sugar, sweets and deep-fried food.",
    "bp": "Blood-pressure-friendly: low sodium, avoid pickles, papad and heavily salted or processed items, "
          "favour vegetables, curd and fruit, keep fried food light.",
    "cholesterol": "Cholesterol-friendly: low saturated fat, minimal ghee, butter, cream and frying, "
                   "favour oats, dals, legumes, vegetables and lean protein, avoid red meat.",
}

TIME_LIMITS = {"<15min": 15, "<30min": 30, "<45min": 45}

_RECIPE_CACHE: Dict[Any, Any] = {}


def _extract_json(text: str) -> Dict[str, Any]:
    start, end = text.find("{"), text.rfind("}") + 1
    if start == -1 or end <= start:
        raise ValueError("No JSON found in model response")
    return json.loads(text[start:end])


class IndianMenuDatabase:
    """Simulated database of Indian dishes - replace with actual DB queries later"""
    
    DISHES = {
        "north_indian": {
            "breakfast": {
                "veg": ["Aloo Paratha", "Chole Bhature", "Poha", "Upma", "Idli Sambhar", "Masala Dosa"],
                "non_veg": ["Egg Paratha", "Keema Paratha", "Chicken Sandwich"],
                "vegan": ["Poha", "Upma", "Vegetable Dalia", "Ragi Dosa"]
            },
            "lunch": {
                "veg": ["Dal Tadka + Roti", "Rajma + Rice", "Chole + Rice", "Palak Paneer + Roti", 
                       "Bhindi Masala + Roti", "Aloo Gobi + Roti", "Mix Veg + Roti"],
                "non_veg": ["Chicken Curry + Rice", "Mutton Curry + Roti", "Fish Curry + Rice"],
                "vegan": ["Dal Tadka + Roti", "Chana Masala + Rice", "Vegetable Curry + Roti"]
            },
            "dinner": {
                "veg": ["Paneer Butter Masala + Roti", "Dal Makhani + Rice", "Stuffed Paratha + Raita"],
                "non_veg": ["Butter Chicken + Naan", "Lamb Biryani", "Fish Fry + Rice"],
                "vegan": ["Mixed Dal + Roti", "Vegetable Biryani", "Stuffed Roti + Pickle"]
            },
            "snacks": {
                "veg": ["Samosa", "Pakora", "Dhokla", "Kachori", "Sandwich"],
                "non_veg": ["Chicken Tikka", "Seekh Kebab", "Egg Roll"],
                "vegan": ["Bhel Puri", "Roasted Chana", "Fruit Chaat"]
            }
        },
        "south_indian": {
            "breakfast": {
                "veg": ["Idli Sambhar", "Masala Dosa", "Uttapam", "Rava Upma", "Medu Vada"],
                "non_veg": ["Egg Dosa", "Chicken 65"],
                "vegan": ["Plain Dosa", "Coconut Rice", "Lemon Rice"]
            },
            "lunch": {
                "veg": ["Sambhar Rice", "Rasam Rice", "Curd Rice", "Vegetable Curry + Rice"],
                "non_veg": ["Fish Curry + Rice", "Chicken Curry + Rice", "Mutton Biryani"],
                "vegan": ["Sambhar Rice", "Tamarind Rice", "Coconut Chutney + Rice"]
            },
            "dinner": {
                "veg": ["Paneer Masala + Rice", "Mixed Vegetable Curry + Rice"],
                "non_veg": ["Chicken Biryani", "Fish Fry + Rice"],
                "vegan": ["Vegetable Biryani", "Dal Rice"]
            },
            "snacks": {
                "veg": ["Murukku", "Banana Chips", "Coconut Laddu"],
                "non_veg": ["Chicken 65", "Fish Fry"],
                "vegan": ["Roasted Groundnuts", "Coconut Barfi"]
            }
        },
        "gujarati": {
            "breakfast": {
                "veg": ["Dhokla", "Khandvi", "Thepla", "Fafda Jalebi", "Poha"],
                "vegan": ["Plain Thepla", "Dhokla", "Khakhra"]
            },
            "lunch": {
                "veg": ["Dal Dhokli", "Undhiyu", "Gujarati Kadhi + Rice", "Bhindi Shaak + Rotli"],
                "vegan": ["Mixed Dal + Rotli", "Vegetable Curry + Rice"]
            },
            "dinner": {
                "veg": ["Gujarati Thali", "Khichdi Kadhi", "Stuffed Paratha"],
                "vegan": ["Simple Khichdi", "Vegetable Curry + Rotli"]
            },
            "snacks": {
                "veg": ["Dhokla", "Kachori", "Chakri", "Sev Mamra"],
                "vegan": ["Khakhra", "Roasted Chana"]
            }
        },
        "marathi": {
            "breakfast": {
                "veg": ["Poha", "Upma", "Misal Pav", "Sabudana Khichdi", "Thalipeeth"],
                "non_veg": ["Chicken Vada Pav", "Egg Curry"], # Added some non-veg options for demonstration
                "vegan": ["Poha", "Upma", "Sabudana Khichdi"]
            },
            "lunch": {
                "veg": ["Dal Rice", "Bharleli Vangi", "Alu Vadi", "Zunka Bhakar"],
                "non_veg": ["Mutton Curry", "Chicken Thali"], # Added non-veg options
                "vegan": ["Dal Rice", "Vegetable Curry + Rice"]
            },
            "dinner": {
                "veg": ["Puran Poli", "Bhakri + Pitla", "Vegetable Curry + Rice"],
                "non_veg": ["Chicken Biryani", "Fish Fry"], # Added non-veg options
                "vegan": ["Simple Dal + Rice", "Vegetable Curry + Bhakri"]
            },
            "snacks": {
                "veg": ["Vada Pav", "Bhel Puri", "Kothimbir Vadi"],
                "non_veg": ["Chicken Kothimbir Vadi"], # Added non-veg options
                "vegan": ["Bhel Puri", "Roasted Chana"]
            }
        },
        "bengali": {
            "breakfast": {
                "veg": ["Luchi Aloo Dum", "Poha", "Cholar Dal + Luchi"],
                "non_veg": ["Fish Curry + Rice", "Egg Curry + Luchi"],
                "vegan": ["Poha", "Aloo Dum + Rice"]
            },
            "lunch": {
                "veg": ["Dal Rice", "Aloo Posto", "Begun Bhaja + Rice"],
                "non_veg": ["Fish Curry + Rice", "Chicken Curry + Rice", "Prawn Malai Curry"],
                "vegan": ["Dal Rice", "Aloo Posto + Rice"]
            },
            "dinner": {
                "veg": ["Khichuri", "Mixed Vegetable + Rice"],
                "non_veg": ["Fish Curry + Rice", "Mutton Curry + Rice"],
                "vegan": ["Simple Khichuri", "Dal Rice"]
            },
            "snacks": {
                "veg": ["Jhal Muri", "Beguni", "Ghugni"],
                "non_veg": ["Fish Fry", "Chicken Cutlet"],
                "vegan": ["Jhal Muri", "Roasted Chana"]
            }
        },
        "punjabi": {
            "breakfast": {
                "veg": ["Chole Bhature", "Aloo Paratha", "Sarson da Saag + Makki Roti"],
                "non_veg": ["Keema Paratha", "Egg Paratha"],
                "vegan": ["Plain Paratha", "Sarson da Saag + Makki Roti"]
            },
            "lunch": {
                "veg": ["Dal Makhani + Naan", "Rajma + Rice", "Palak Paneer + Roti"],
                "non_veg": ["Butter Chicken + Naan", "Mutton Curry + Rice"],
                "vegan": ["Chana Masala + Rice", "Mixed Dal + Roti"]
            },
            "dinner": {
                "veg": ["Paneer Tikka Masala + Naan", "Dal Tadka + Rice"],
                "non_veg": ["Chicken Tikka Masala + Naan", "Lamb Curry + Rice"],
                "vegan": ["Mixed Vegetable + Roti", "Dal Rice"]
            },
            "snacks": {
                "veg": ["Samosa", "Pakora", "Kulcha"],
                "non_veg": ["Chicken Tikka", "Seekh Kebab"],
                "vegan": ["Chana Chaat", "Fruit Chaat"]
            }
        }
    }
    
    NUTRITIONAL_BALANCE = {
        "high_protein": ["Dal", "Paneer", "Chicken", "Fish", "Egg", "Chana", "Rajma"],
        "high_fiber": ["Bhindi", "Palak", "Mixed Veg", "Salad", "Gobi", "Begun"],
        "low_oil": ["Steamed", "Boiled", "Grilled", "Idli", "Upma"],
        "diabetic_friendly": ["Dal", "Vegetables", "Grilled items", "Salad", "Upma", "Poha"]
    }

class MenuGenerationTools:
    """Tools for the LangChain agent to use"""
    
    def __init__(self):
        self.db = IndianMenuDatabase()
    
    def get_dishes_by_criteria(self, cuisine: str, meal_type: str, diet_type: str, count: int = 5) -> List[str]:
        """Get dishes based on cuisine, meal type, and diet preference"""
        try:
            norm = lambda x: x.strip().lower().replace('-', '_').replace(' ', '_')
            cuisines = [norm(c) for c in cuisine.split(',') if c.strip()]
            meal_type = norm(meal_type)
            diets = [norm(d) for d in str(diet_type).split(',') if d.strip()] or ['veg']
            diet_type = ','.join(diets)
            all_dishes = []
            for c in cuisines:
                for d in diets:
                    dishes = self.db.DISHES.get(c, {}).get(meal_type, {}).get(d, [])
                    all_dishes.extend(dishes)
            
            dishes_result = random.sample(list(set(all_dishes)), min(count, len(list(set(all_dishes))))) if all_dishes else []
            
            # This is the key change: return a more informative string
            if not dishes_result:
                return f"No dishes found in internal database for cuisine(s) {cuisines}, meal {meal_type}, diet {diet_type}."
            return dishes_result
        except Exception as e:
            return f"An error occurred while fetching dishes: {e}"
    
    def check_nutritional_balance(self, dishes: List[str], health_conditions: List[str]) -> Dict[str, Any]:
        """Check if the meal plan is nutritionally balanced"""
        balance_score = 0
        recommendations = []
        
        protein_dishes = [dish for dish in dishes if any(protein in dish for protein in self.db.NUTRITIONAL_BALANCE["high_protein"])]
        if len(protein_dishes) >= 2:
            balance_score += 25
        else:
            recommendations.append("Add more protein sources like Dal, Paneer, or Chicken")
        
        fiber_dishes = [dish for dish in dishes if any(fiber in dish for fiber in self.db.NUTRITIONAL_BALANCE["high_fiber"])]
        if len(fiber_dishes) >= 3:
            balance_score += 25
        else:
            recommendations.append("Include more vegetables like Bhindi, Palak, or Mixed Vegetables")
        
        if len(set(dishes)) == len(dishes):
            balance_score += 25
        else:
            recommendations.append("Ensure variety - avoid repeating similar dishes")
        
        if "diabetes" in health_conditions:
            diabetic_friendly = [dish for dish in dishes if any(friendly in dish for friendly in self.db.NUTRITIONAL_BALANCE["diabetic_friendly"])]
            if len(diabetic_friendly) >= len(dishes) * 0.6:
                balance_score += 25
            else:
                recommendations.append("Choose more diabetic-friendly options like Dal and Vegetables")
        else:
            balance_score += 25
        
        return {
            "balance_score": balance_score,
            "recommendations": recommendations,
            "is_balanced": balance_score >= 75
        }
    
    def generate_grocery_list(self, weekly_menu: Dict) -> Dict[str, List[str]]:
        """Generate grocery list from weekly menu"""
        grocery_categories = {
            "vegetables": [],
            "grains_pulses": [],
            "dairy_proteins": [],
            "spices_condiments": [],
            "others": []
        }
        
        ingredient_mapping = {
            "Dal": ("grains_pulses", ["Toor Dal", "Moong Dal", "Masoor Dal"]),
            "Paneer": ("dairy_proteins", ["Paneer", "Milk"]),
            "Chicken": ("dairy_proteins", ["Chicken"]),
            "Rice": ("grains_pulses", ["Basmati Rice"]),
            "Roti": ("grains_pulses", ["Wheat Flour"]),
            "Bhindi": ("vegetables", ["Bhindi (Okra)"]),
            "Aloo": ("vegetables", ["Potatoes"]),
            "Palak": ("vegetables", ["Spinach"]),
            "Gobi": ("vegetables", ["Cauliflower"]),
            "Fish": ("dairy_proteins", ["Fresh Fish"]),
            "Egg": ("dairy_proteins", ["Eggs"]),
            "Chole": ("grains_pulses", ["Chickpeas"]),
            "Rajma": ("grains_pulses", ["Kidney Beans"])
        }
        
        all_dishes = []
        for day_menu in weekly_menu.values():
            all_dishes.extend(day_menu.values())
        
        for dish in all_dishes:
            for ingredient, (category, items) in ingredient_mapping.items():
                if ingredient in dish:
                    grocery_categories[category].extend(items)
        
        for category in grocery_categories:
            grocery_categories[category] = list(set(grocery_categories[category]))
        
        return grocery_categories

class IndianMenuAgent:
    """Main agent class for generating Indian meal plans"""
    
    def __init__(self, together_api_key: str):
        self.together_api_key = together_api_key
        try:
            os.environ["TOGETHER_API_KEY"] = together_api_key
            # Together AI exposes an OpenAI-compatible API
            self.llm = ChatOpenAI(
                temperature=0.7,
                model=os.environ.get("LLM_MODEL") or os.environ.get("TOGETHER_MODEL", "meta-llama/Llama-3-8b-chat-hf"),
                api_key=together_api_key,
                base_url=os.environ.get("LLM_BASE_URL", "https://api.together.xyz/v1"),
                timeout=60,
                max_retries=1,
            )
        except Exception as e:
            print(f"Warning: Could not initialize Together AI client: {e}")
            self.llm = None
            
        self.tools_handler = MenuGenerationTools()
        self.memory = ConversationBufferMemory(memory_key="chat_history", return_messages=True) if self.llm else None
        self.tools = self._create_tools() if self.llm else []
        self.agent_executor = self._create_agent() if self.llm else None

    def _parse_get_dishes_input(self, input_str: str) -> str:
        """Parse input for get_dishes_by_criteria to ensure count is an integer"""
        parts = input_str.split(",")
        cuisine = parts[0]
        meal_type = parts[1]
        diet_type = parts[2]
        count = 5
        if len(parts) > 3 and parts[3].isdigit():
            count = int(parts[3])
        return f"{cuisine},{meal_type},{diet_type},{count}"

    def _create_tools(self) -> List[Tool]:
        """Create tools for the agent, including new web search tools."""
        
        search = DuckDuckGoSearchRun()
        
        def get_summary(url: str) -> str:
            try:
                loader = WebBaseLoader(url)
                docs = loader.load()
                text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0)
                split_docs = text_splitter.split_documents(docs)
                summarize_chain = load_summarize_chain(self.llm, chain_type="stuff")
                return summarize_chain.run(split_docs)
            except Exception as e:
                return f"Error summarizing URL {url}: {e}"
        
        return [
            Tool(
                name="get_dishes_by_criteria",
                description="Get dishes from the internal database based on cuisine, meal type, and diet preference. Input: 'cuisine,meal_type,diet_type,count'. 'count' must be a number. This tool will return a list of dishes or a message if none are found. The agent should use 'search_for_new_dishes' if the result indicates no dishes were found.",
                func=lambda x: str(self.tools_handler.get_dishes_by_criteria(*self._parse_get_dishes_input(x).split(',')))
            ),
            Tool(
                name="check_nutritional_balance",
                description="Check nutritional balance of dishes and health conditions. Input: 'dish1,dish2,dish3|health_condition1,health_condition2'",
                func=lambda x: str(self._parse_balance_input(x))
            ),
            Tool(
                name="generate_grocery_list",
                description="Generate grocery list from weekly menu. Input: JSON string of weekly menu. This tool should only be called after a full menu has been successfully generated.",
                func=lambda x: str(self.tools_handler.generate_grocery_list(json.loads(x)))
            ),
            Tool(
                name="search_for_new_dishes",
                description="Searches the web for latest Indian dish ideas, recipes, or trends. Use this tool if the internal database does not return results or if the user requests modern/new dishes. Input should be a specific search query like 'latest Punjabi breakfast dishes' or 'new vegan dinner recipes'.",
                func=search.run
            ),
            Tool(
                name="summarize_web_content",
                description="Summarizes the content of a given URL to extract dish names and ingredients. Input should be a single URL.",
                func=get_summary
            )
        ]
    
    def _parse_balance_input(self, input_str: str) -> Dict:
        """Parse input for nutritional balance check"""
        parts = input_str.split("|")
        dishes = parts[0].split(",") if parts[0] else []
        health_conditions = parts[1].split(",") if len(parts) > 1 and parts[1] else []
        return self.tools_handler.check_nutritional_balance(dishes, health_conditions)
    
    def _create_agent(self) -> AgentExecutor:
        """Create the main agent executor"""
        
        prompt_template = """
You are an expert Indian cuisine meal planner. Your goal is to create balanced, diverse, and delicious weekly meal plans.
You MUST use the tools provided. Do not invent your own tools.

You have access to the following tools:
{tools}

Use the following format:
Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input

Remember:
1. First, try to use the 'get_dishes_by_criteria' tool.
2. If that tool's result is insufficient (e.g., it returns an empty list), you MUST use the 'tavily_search' tool to find more dishes.
3. When using 'tavily_search', use a concise and effective query, like "popular Rajasthani vegetarian dinner dishes".
4. After receiving the 'Observation' from 'tavily_search', carefully read the content to extract dish names and then use those names to construct the final menu.
5. Do NOT try to summarize web content or use any other tools that are not in your list.
6. Once you have a complete 7-day menu, provide the final answer as a single, valid JSON object.

Question: {input}
Thought: {agent_scratchpad}
"""
        
        prompt = PromptTemplate.from_template(prompt_template)
        
        agent = create_react_agent(
            llm=self.llm,
            tools=self.tools,
            prompt=prompt
        )
        
        return AgentExecutor(
            agent=agent,
            tools=self.tools,
            memory=self.memory,
            verbose=True,
            max_iterations=6,
            max_execution_time=60,
            handle_parsing_errors=True
        )
    
    # ------------------------------------------------------------------
    # AI helpers
    # ------------------------------------------------------------------
    def _ask_json(self, prompt: str) -> Dict[str, Any]:
        if not self.llm:
            raise RuntimeError("AI service is not configured")
        response = self.llm.invoke(prompt)
        text = response.content if hasattr(response, "content") else str(response)
        return _extract_json(text)

    @staticmethod
    def _clean_locked(locked: Any, meals: List[str]) -> Dict[str, Dict[str, str]]:
        cleaned: Dict[str, Dict[str, str]] = {}
        if not isinstance(locked, dict):
            return cleaned
        for day, day_meals in locked.items():
            if day not in DAYS or not isinstance(day_meals, dict):
                continue
            for meal, dish in day_meals.items():
                meal_key = str(meal).lower()
                if meal_key in meals and isinstance(dish, str) and dish.strip():
                    cleaned.setdefault(day, {})[meal_key] = dish.strip()
        return cleaned

    # ------------------------------------------------------------------
    # Menu generation
    # ------------------------------------------------------------------
    def generate_weekly_menu(self, preferences: Dict[str, Any], notes: Any = None,
                             locked: Any = None, avoid: Any = None) -> Dict[str, Any]:
        """Generate a weekly menu with one AI call (falls back to the built-in dish list)."""
        preferences = dict(preferences)
        meals = [m.strip().lower() for m in preferences.get("meals", []) if m and m.strip()] \
            or ["breakfast", "lunch", "dinner"]
        preferences["meals"] = meals
        if isinstance(notes, str) and notes.strip():
            preferences["notes"] = notes.strip()[:500]

        locked_clean = self._clean_locked(locked, meals)
        locked_dishes = {d.lower() for day in locked_clean.values() for d in day.values()}
        avoid_list = sorted({a for a in (avoid or []) if isinstance(a, str) and a.strip()
                             and a.lower() not in locked_dishes})

        if self.llm:
            try:
                return self._direct_menu_generation(preferences, locked_clean, avoid_list)
            except Exception as e:
                print(f"Error in menu generation: {e}")
        return self._fallback_menu_generation(preferences, locked_clean, avoid_list)

    def _direct_menu_generation(self, preferences: Dict[str, Any], locked: Dict[str, Dict[str, str]],
                                avoid: List[str]) -> Dict[str, Any]:
        meals = preferences["meals"]
        cuisines = [c.strip() for c in preferences.get("cuisine", []) if c and c.strip()]
        diet_list = [d.strip() for d in (preferences.get("diet_type") or "veg").split(",") if d.strip()]
        diet = ", ".join(diet_list)
        mixed = len(diet_list) > 1

        ideas = []
        for c in cuisines:
            for meal in meals:
                found = self.tools_handler.get_dishes_by_criteria(c, meal, ",".join(diet_list), 8)
                if isinstance(found, list):
                    ideas.extend(found)
        ideas = sorted(set(ideas))

        lines = [
            "You are an expert Indian home-cooking meal planner. Create a practical 7-day meal plan for an Indian household.",
            f"Diet types the user eats: {diet}.",
        ]
        if mixed:
            lines.append(
                "This is a MIXED diet. Spread the selected diet types sensibly across the week: if non-veg is selected "
                "together with veg, serve non-veg in roughly a third to half of the lunches and dinners and keep the other "
                "meals vegetarian; breakfasts and snacks may stay vegetarian. If vegan is also selected, include some fully "
                "vegan meals. Do NOT make every meal the same diet type."
            )
        else:
            lines.append(f"Every dish must strictly be {diet}.")
        lines.append(f"Cuisines to spread across the week: {', '.join(cuisines) or 'Indian'}.")
        lines.append(f"Meals per day: {', '.join(meals)}.")

        limit = TIME_LIMITS.get(preferences.get("cooking_time") or "")
        if limit:
            lines.append(f"Every dish must be quick: under {limit} minutes of cooking time.")

        health = [h.strip() for h in preferences.get("health_conditions", []) if h and h.strip()]
        for h in health:
            if h in HEALTH_GUIDE:
                lines.append(HEALTH_GUIDE[h])

        if preferences.get("notes"):
            lines.append("Extra instructions from the user (follow strictly): " + preferences["notes"])
        if avoid:
            lines.append("Do not reuse any of these dishes from last week: " + ", ".join(avoid) + ".")
        if locked:
            fixed = "; ".join(f"{d} {m} = {dish}" for d, ms in locked.items() for m, dish in ms.items())
            lines.append("These dishes are FIXED (chosen by the user). Keep them exactly and plan the rest around them: " + fixed + ".")
        if ideas:
            lines.append("Example dishes you may use or take inspiration from: " + ", ".join(ideas) + ".")

        lines.append(
            "Quality rules: every dish is unique across the week; vary the main ingredient and cooking style from day to day; "
            "breakfast and snacks are lighter, lunch is the most substantial meal and dinner is lighter than lunch; "
            "pair mains with the accompaniment they are normally served with (for example 'Dal Tadka + Jeera Rice' or "
            "'Aloo Gobi + Roti'); use commonly known dish names with no descriptions; rotate protein sources (dals, legumes, "
            "paneer, eggs, and fish or chicken only if the diet allows) and include seasonal vegetables; make Sunday lunch a little special."
        )
        lines.append(
            "Reply with ONLY a valid JSON object, no explanation and no markdown. "
            f"Keys are {DAYS}. Each value is an object whose keys are exactly {meals} and whose values are a single dish name (a string)."
        )
        base_prompt = "\n".join(lines)

        def build_menu(data: Dict[str, Any]) -> Dict[str, Dict[str, str]]:
            menu: Dict[str, Dict[str, str]] = {}
            for day in DAYS:
                day_data = data.get(day) or {}
                lowered = {str(k).lower(): v for k, v in day_data.items()} if isinstance(day_data, dict) else {}
                menu[day] = {}
                for meal in meals:
                    dish = locked.get(day, {}).get(meal) or lowered.get(meal)
                    if isinstance(dish, list):
                        dish = ", ".join(str(x) for x in dish)
                    if not dish or not str(dish).strip():
                        raise ValueError(f"Missing {meal} for {day}")
                    menu[day][meal] = str(dish).strip()
            return menu

        def repeated(menu: Dict[str, Dict[str, str]]) -> List[str]:
            seen: Dict[str, int] = {}
            for day, ms in menu.items():
                for meal, dish in ms.items():
                    if locked.get(day, {}).get(meal):
                        continue
                    seen[dish.lower()] = seen.get(dish.lower(), 0) + 1
            return [d for d, n in seen.items() if n > 1]

        prompt = base_prompt
        menu = None
        for attempt in range(2):
            menu = build_menu(self._ask_json(prompt))
            dups = repeated(menu)
            if not dups:
                break
            prompt = base_prompt + "\nYour previous answer repeated these dishes: " + ", ".join(dups) + ". Fix this: every dish must be unique."

        return {
            "menu": menu,
            "preferences_used": preferences,
            "generated_at": datetime.now().isoformat(),
        }

    # ------------------------------------------------------------------
    # Recipes and grocery lists
    # ------------------------------------------------------------------
    def get_recipe(self, dish: str, servings: int = 4) -> Dict[str, Any]:
        key = (dish.lower(), servings)
        if key in _RECIPE_CACHE:
            return _RECIPE_CACHE[key]

        prompt = (
            f'You are an Indian home-cooking expert. Give a clear, practical recipe for "{dish}" for {servings} servings, '
            "suitable for a home kitchen.\n"
            "Reply with ONLY valid JSON (no markdown) in exactly this shape:\n"
            '{"name": "...", "description": "one short sentence", "time_minutes": 30, "calories_per_serving": 350, '
            '"diet": "veg", "ingredients": [{"item": "...", "quantity": "..."}], "steps": ["..."], "tip": "one short helpful tip"}\n'
            'The "diet" value is one of: veg, non-veg, vegan. Use household measures (grams, cups, tsp, tbsp). '
            "Keep it to at most 12 ingredients and 8 short steps. If the dish name has several parts "
            "(like 'Dal Tadka + Jeera Rice'), cover all parts in the ingredients and steps."
        )
        data = self._ask_json(prompt)

        def to_int(value: Any, default: int) -> int:
            try:
                return int(float(str(value).split()[0]))
            except Exception:
                return default

        ingredients = []
        for ing in data.get("ingredients", []) or []:
            if isinstance(ing, dict) and ing.get("item"):
                ingredients.append({"item": str(ing["item"]), "quantity": str(ing.get("quantity", ""))})
            elif isinstance(ing, str) and ing.strip():
                ingredients.append({"item": ing.strip(), "quantity": ""})
        steps = [str(x) for x in (data.get("steps") or []) if str(x).strip()]
        if not ingredients or not steps:
            raise ValueError("Incomplete recipe from model")

        recipe = {
            "name": str(data.get("name") or dish),
            "description": str(data.get("description") or ""),
            "time_minutes": to_int(data.get("time_minutes"), 30),
            "servings": servings,
            "calories_per_serving": to_int(data.get("calories_per_serving"), 0),
            "diet": str(data.get("diet") or ""),
            "ingredients": ingredients,
            "steps": steps,
            "tip": str(data.get("tip") or ""),
        }
        if len(_RECIPE_CACHE) > 500:
            _RECIPE_CACHE.clear()
        _RECIPE_CACHE[key] = recipe
        return recipe

    def get_grocery_list(self, menu: Dict[str, Dict[str, str]], servings: int = 4) -> Dict[str, Any]:
        menu_text = "\n".join(
            f"{day}: " + "; ".join(f"{meal}: {dish}" for meal, dish in meals.items())
            for day, meals in menu.items()
        )
        prompt = (
            f"Create ONE combined weekly grocery list for {servings} people for this meal plan:\n{menu_text}\n"
            "Merge duplicate ingredients and add up quantities sensibly (use kg, g, litres, ml or counts). "
            "Assume salt and water are available. Do not list the dishes.\n"
            'Reply with ONLY valid JSON (no markdown): {"categories": [{"name": "Vegetables & Fruits", '
            '"items": [{"item": "Onions", "quantity": "1 kg"}]}]}\n'
            "Use only these category names, in this order, and skip empty ones: Vegetables & Fruits, "
            "Dals, Grains & Flours, Dairy & Eggs, Meat & Fish, Spices & Masalas, Oils & Others."
        )
        data = self._ask_json(prompt)
        categories = []
        for cat in data.get("categories", []) or []:
            if not isinstance(cat, dict):
                continue
            items = []
            for it in cat.get("items", []) or []:
                if isinstance(it, dict) and it.get("item"):
                    items.append({"item": str(it["item"]), "quantity": str(it.get("quantity", ""))})
                elif isinstance(it, str) and it.strip():
                    items.append({"item": it.strip(), "quantity": ""})
            if items:
                categories.append({"name": str(cat.get("name") or "Others"), "items": items})
        if not categories:
            raise ValueError("Empty grocery list from model")
        return {"categories": categories}

    def _parse_agent_response(self, response: str, preferences: Dict) -> Dict[str, Any]:
        """Parse agent response and structure it properly"""
        try:
            start_idx = response.find('{')
            end_idx = response.rfind('}') + 1
            
            if start_idx != -1 and end_idx != -1:
                json_str = response[start_idx:end_idx]
                menu_data = json.loads(json_str)
            else:
                raise ValueError("No JSON found in response")
            
            return {
                "menu": menu_data,
                "preferences_used": preferences,
                "generated_at": datetime.now().isoformat(),
                "agent_response": response
            }
        except Exception as e:
            print(f"Error parsing agent response: {e}")
            return self._fallback_menu_generation(preferences)
    
    def _fallback_menu_generation(self, preferences: Dict, locked: Dict = None, avoid: List[str] = None) -> Dict[str, Any]:
        """Fallback menu generation if the AI is unavailable"""
        locked = locked or {}
        avoid_set = set(avoid or [])
        fallback_menu = {}

        diet_type = preferences.get('diet_type') or 'veg'
        diets = [d.strip() for d in diet_type.split(',') if d.strip()] or ['veg']
        cuisines = preferences.get('cuisine') or ['north_indian']
        meals = preferences.get('meals') or ['breakfast', 'lunch', 'dinner']

        used_dishes = set(d for day in locked.values() for d in day.values())

        for day in DAYS:
            fallback_menu[day] = {}
            for meal in meals:
                if locked.get(day, {}).get(meal):
                    fallback_menu[day][meal] = locked[day][meal]
                    continue
                dish_found = False
                # Try the selected diets in random order so they get mixed across the week.
                # Breakfast and snacks lean vegetarian when veg is one of the choices.
                order = diets[:]
                random.shuffle(order)
                if meal in ('breakfast', 'snacks') and 'veg' in order:
                    order.remove('veg')
                    order.insert(0, 'veg')
                for diet in order:
                    for cuisine in cuisines:
                        dishes = self.tools_handler.get_dishes_by_criteria(cuisine, meal, diet, 20)
                        if isinstance(dishes, list) and dishes:
                            available = ([d for d in dishes if d not in used_dishes and d not in avoid_set]
                                         or [d for d in dishes if d not in used_dishes]
                                         or dishes)
                            selected_dish = random.choice(available)
                            fallback_menu[day][meal] = selected_dish
                            used_dishes.add(selected_dish)
                            dish_found = True
                            break
                    if dish_found:
                        break

                if not dish_found:
                    fallback_menu[day][meal] = f"{meal.title()} of the day"

        return {
            "menu": fallback_menu,
            "preferences_used": preferences,
            "generated_at": datetime.now().isoformat(),
            "fallback_used": True,
            "message": "Generated using fallback system"
        }