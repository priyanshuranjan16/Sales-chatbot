// server.js
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // Use port 3001 for backend

// Middleware
app.use(cors()); // Enable CORS for all origins (for development)
app.use(express.json()); // Parse JSON request bodies

// Supabase Client Initialization
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY must be set in your .env file.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to format dates as 'YYYY-MM-DD'
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Helper function to get date ranges based on natural language
const getDateRange = (timeFilter) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    let startDate = null;
    let endDate = null;

    // Handle null or empty timeFilter explicitly
    if (!timeFilter) {
        return { startDate: null, endDate: null };
    }

    // Convert timeFilter to lowercase once for the switch statement
    const lowerCaseTimeFilter = timeFilter.toLowerCase();

    // Try to parse specific date strings like "July 1st" or "1st July"
    const monthDayRegex = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})(?:st|nd|rd|th)?/i;
    const dayMonthRegex = /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i;
    const monthNames = ["january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"];

    let match = lowerCaseTimeFilter.match(monthDayRegex);
    if (!match) {
        match = lowerCaseTimeFilter.match(dayMonthRegex);
        if (match) { // If day-month format, swap to month-day for consistent parsing
            match = [match[0], match[2], match[1]];
        }
    }

    if (match) {
        const monthName = match[1];
        const day = parseInt(match[2], 10);
        const monthIndex = monthNames.indexOf(monthName);
        const currentYear = today.getFullYear();

        if (monthIndex !== -1 && day >= 1 && day <= 31) { // Basic day validation
            const specificDate = new Date(currentYear, monthIndex, day);
            // Check if the date is valid and falls within the current year for simplicity
            if (!isNaN(specificDate.getTime()) && specificDate.getFullYear() === currentYear) {
                startDate = specificDate;
                endDate = specificDate;
                return { startDate: formatDate(startDate), endDate: formatDate(endDate) };
            }
        }
    }


    switch (lowerCaseTimeFilter) {
        case 'today':
            startDate = today;
            endDate = today;
            break;
        case 'yesterday':
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 1);
            endDate = startDate;
            break;
        case 'last week':
            endDate = new Date(today);
            endDate.setDate(today.getDate() - 1); // End yesterday
            startDate = new Date(endDate);
            startDate.setDate(endDate.getDate() - 6); // 7 days including yesterday
            break;
        case 'this month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today; // Up to today
            break;
        case 'last weekend':
            const dayOfWeekLastWeekend = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            if (dayOfWeekLastWeekend === 0) { // If today is Sunday, last weekend was yesterday and the day before
                endDate = new Date(today);
                endDate.setDate(today.getDate() - 1); // Yesterday (Saturday)
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 1); // Day before yesterday (Friday)
            } else if (dayOfWeekLastWeekend === 1) { // If today is Monday, last weekend was Saturday and Sunday
                endDate = new Date(today);
                endDate.setDate(today.getDate() - 1); // Yesterday (Sunday)
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 1); // Day before yesterday (Saturday)
            } else { // For other days, calculate based on last Saturday/Sunday
                endDate = new Date(today);
                endDate.setDate(today.getDate() - (dayOfWeekLastWeekend + 1)); // Last Sunday
                startDate = new Date(endDate);
                startDate.setDate(endDate.getDate() - 1); // Last Saturday
            }
            break;
        case 'this weekend':
            const dayOfWeekThisWeekend = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            if (dayOfWeekThisWeekend === 6) { // If today is Saturday
                startDate = today;
                endDate = new Date(today);
                endDate.setDate(today.getDate() + 1); // Sunday
            } else if (dayOfWeekThisWeekend === 0) { // If today is Sunday
                startDate = today;
                endDate = today;
            } else { // If today is Mon-Fri, calculate upcoming Saturday and Sunday
                startDate = new Date(today);
                startDate.setDate(today.getDate() + (6 - dayOfWeekThisWeekend)); // Next Saturday
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 1); // Next Sunday
            }
            break;
        case 'past 3 days':
            endDate = today;
            startDate = new Date(today);
            startDate.setDate(today.getDate() - 2); // Today - 2 days = 3 days total
            break;
        case 'current month': // For specific month queries like "July"
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = today;
            break;
        case 'last month': // Explicitly handle 'last month'
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            startDate = lastMonth;
            endDate = new Date(today.getFullYear(), today.getMonth(), 0); // Last day of last month
            break;
        default:
            // Attempt to parse as a specific date (YYYY-MM-DD)
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (dateRegex.test(timeFilter)) {
                const parsedDate = new Date(timeFilter);
                // Check if the parsedDate is valid (e.g., not "Invalid Date")
                if (!isNaN(parsedDate.getTime())) {
                    startDate = parsedDate;
                    endDate = parsedDate;
                } else {
                    // Handle specific month names (e.g., "July") if not a valid date string
                    const monthIndex = monthNames.indexOf(lowerCaseTimeFilter);
                    if (monthIndex !== -1) {
                        startDate = new Date(today.getFullYear(), monthIndex, 1);
                        endDate = new Date(today.getFullYear(), monthIndex + 1, 0); // Last day of the month
                        if (startDate > today) {
                            startDate = null;
                            endDate = null;
                        } else if (endDate > today) {
                            endDate = today;
                        }
                    } else {
                        startDate = null;
                        endDate = null;
                    }
                }
            } else {
                // If it's not a recognized time filter, month name, or valid date string
                startDate = null;
                endDate = null;
            }
            break;
    }

    return {
        startDate: startDate ? formatDate(startDate) : null,
        endDate: endDate ? formatDate(endDate) : null
    };
};


// Chatbot API endpoint
app.post('/api/chat', async (req, res) => {
    const userQuery = req.body.query;

    if (!userQuery) {
        return res.status(400).json({ error: 'Query is required.' });
    }

    try {
        // Step 1: Use LLM (Gemini API) to parse the natural language query
        let chatHistory = [];
        chatHistory.push({
            role: "user",
            parts: [{
                text: `Parse the following sales query into a structured JSON object.
                Extract the 'query_type' (e.g., 'total_sales', 'average_revenue', 'items_sold', 'total_quantity', 'sales_for_store', 'most_profitable_store', 'least_profitable_store'),
                'time_filter' (e.g., 'today', 'yesterday', 'last week', 'this month', 'last weekend', 'past 3 days', 'this weekend', or a specific month name like 'July' or a specific date like '2025-07-21' or 'July 1st'),
                'store_name' (if specified, otherwise null), and 'item_name' (if specified, otherwise null).
                If a month is mentioned (e.g., 'July'), set 'time_filter' to that month name. If a specific date is mentioned (e.g., '2025-07-21' or 'July 1st'), set 'time_filter' to the 'YYYY-MM-DD' date string.

                Examples:
                - "What was the total sales yesterday?" -> {"query_type": "total_sales", "time_filter": "yesterday", "store_name": null, "item_name": null}
                - "What was the average revenue last week?" -> {"query_type": "average_revenue", "time_filter": "last week", "store_name": null, "item_name": null}
                - "How many items were sold today?" -> {"query_type": "items_sold", "time_filter": "today", "store_name": null, "item_name": null}
                - "What is the total quantity sold this month?" -> {"query_type": "total_quantity", "time_filter": "this month", "store_name": null, "item_name": null}
                - "What is the sales for Store A in July?" -> {"query_type": "sales_for_store", "time_filter": "July", "store_name": "Store A", "item_name": null}
                - "Total revenue for laptops last month?" -> {"query_type": "total_sales", "time_filter": "last month", "store_name": null, "item_name": "laptop"}
                - "Sales for Store B last weekend?" -> {"query_type": "total_sales", "time_filter": "last weekend", "store_name": "Store B", "item_name": null}
                - "Total quantity of mice sold in the past 3 days?" -> {"query_type": "total_quantity", "time_filter": "past 3 days", "store_name": null, "item_name": "mouse"}
                - "Which store made the most profit?" -> {"query_type": "most_profitable_store", "time_filter": null, "store_name": null, "item_name": null}
                - "Which store had the highest sales last month?" -> {"query_type": "most_profitable_store", "time_filter": "last month", "store_name": null, "item_name": null}
                - "Which store made the least profit?" -> {"query_type": "least_profitable_store", "time_filter": null, "store_name": null, "item_name": null}
                - "Which store had the lowest sales this week?" -> {"query_type": "least_profitable_store", "time_filter": "this week", "store_name": null, "item_name": null}
                - "What were the sales this weekend?" -> {"query_type": "total_sales", "time_filter": "this weekend", "store_name": null, "item_name": null}
                - "How many items were sold on 2025-07-20?" -> {"query_type": "items_sold", "time_filter": "2025-07-20", "store_name": null, "item_name": null}
                - "What was the total revenue on 2025-07-15?" -> {"query_type": "total_sales", "time_filter": "2025-07-15", "store_name": null, "item_name": null}
                - "What were the sales on July 1st?" -> {"query_type": "total_sales", "time_filter": "2025-07-01", "store_name": null, "item_name": null}
                - "How many items sold on 1st August?" -> {"query_type": "items_sold", "time_filter": "2025-08-01", "store_name": null, "item_name": null}

                Query: "${userQuery}"`
            }]
        });

        const payload = {
            contents: chatHistory,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        "query_type": { "type": "STRING" },
                        "time_filter": { "type": "STRING", "nullable": true },
                        "store_name": { "type": "STRING", "nullable": true },
                        "item_name": { "type": "STRING", "nullable": true }
                    },
                    "propertyOrdering": ["query_type", "time_filter", "store_name", "item_name"]
                }
            }
        };

        // IMPORTANT: If running locally, ensure GEMINI_API_KEY is set in your .env file.
        // If running in Canvas, the empty string will be automatically populated.
        const apiKey = process.env.GEMINI_API_KEY || "";
        if (!apiKey) {
            console.error("ERROR: Gemini API Key is not set. Please ensure GEMINI_API_KEY is in your .env file or provided by the environment.");
            return res.status(500).json({ error: "Gemini API Key is missing on the server." });
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        console.log("Calling Gemini API with payload:", JSON.stringify(payload, null, 2));
        const llmResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!llmResponse.ok) {
            const errorText = await llmResponse.text();
            console.error(`Gemini API call failed with status ${llmResponse.status}: ${errorText}`);
            return res.status(llmResponse.status).json({ error: `Failed to get response from AI: ${errorText}` });
        }

        const llmResult = await llmResponse.json();
        console.log("Gemini API Raw Result:", JSON.stringify(llmResult, null, 2));


        if (!llmResult.candidates || llmResult.candidates.length === 0 ||
            !llmResult.candidates[0].content || !llmResult.candidates[0].content.parts ||
            llmResult.candidates[0].content.parts.length === 0) {
            console.error("Unexpected LLM response structure:", JSON.stringify(llmResult, null, 2));
            return res.status(500).json({ error: "Could not parse your query. Please try rephrasing." });
        }

        const parsedQueryJsonString = llmResult.candidates[0].content.parts[0].text;
        let parsedQuery;
        try {
            parsedQuery = JSON.parse(parsedQueryJsonString);
        } catch (jsonParseError) {
            console.error("Error parsing LLM JSON response:", jsonParseError);
            console.error("Raw LLM response text:", parsedQueryJsonString);
            return res.status(500).json({ error: "AI provided an unreadable response. Please try again." });
        }

        console.log("Parsed Query:", parsedQuery);

        const { query_type, time_filter, store_name, item_name } = parsedQuery;

        let { startDate, endDate } = getDateRange(time_filter);

        let query;
        let responseMessage = "I couldn't find any data matching your request.";
        let totalRevenue = 0;
        let totalQuantity = 0;
        let averageRevenue = 0;

        if (query_type === 'most_profitable_store') {
            // Query for most profitable store
            query = supabase.from('sale_records').select('store, revenue, quantity');

            if (startDate && endDate) {
                query = query.gte('date', startDate).lte('date', endDate);
                console.log(`Supabase Query Date Range for most_profitable_store: ${startDate} to ${endDate}`);
            } else {
                console.log("No time filter specified for most_profitable_store. Querying all available dates.");
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase query error for most_profitable_store:', error);
                return res.status(500).json({ error: 'Error fetching data for most profitable store.' });
            }

            if (data && data.length > 0) {
                const storeProfits = {};
                data.forEach(record => {
                    storeProfits[record.store] = (storeProfits[record.store] || 0) + record.revenue;
                });

                let topStore = null;
                let maxProfit = 0; // Initialize with 0 for finding max
                for (const store in storeProfits) {
                    if (storeProfits[store] > maxProfit) {
                        maxProfit = storeProfits[store];
                        topStore = store;
                    }
                }

                if (topStore) {
                    const dateRangeText = (startDate && endDate && startDate === endDate) ? `on ${startDate}` :
                                          (startDate && endDate) ? `between ${startDate} and ${endDate}` :
                                          time_filter ? `for ${time_filter}` : '';
                    responseMessage = `The store that made the most profit ${dateRangeText} was ${topStore} with a total revenue of ₹${maxProfit.toFixed(2)}.`;
                } else {
                    responseMessage = `Could not determine the most profitable store ${dateRangeText}.`;
                }
            } else {
                responseMessage = `No sales data found to determine the most profitable store ${time_filter ? `for ${time_filter}` : ''}.`;
            }

        } else if (query_type === 'least_profitable_store') {
            // Query for least profitable store
            query = supabase.from('sale_records').select('store, revenue, quantity');

            if (startDate && endDate) {
                query = query.gte('date', startDate).lte('date', endDate);
                console.log(`Supabase Query Date Range for least_profitable_store: ${startDate} to ${endDate}`);
            } else {
                console.log("No time filter specified for least_profitable_store. Querying all available dates.");
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase query error for least_profitable_store:', error);
                return res.status(500).json({ error: 'Error fetching data for least profitable store.' });
            }

            if (data && data.length > 0) {
                const storeProfits = {};
                data.forEach(record => {
                    storeProfits[record.store] = (storeProfits[record.store] || 0) + record.revenue;
                });

                let bottomStore = null;
                let minProfit = Infinity; // Initialize with Infinity for finding min
                for (const store in storeProfits) {
                    if (storeProfits[store] < minProfit) {
                        minProfit = storeProfits[store];
                        bottomStore = store;
                    }
                }

                if (bottomStore) {
                    const dateRangeText = (startDate && endDate && startDate === endDate) ? `on ${startDate}` :
                                          (startDate && endDate) ? `between ${startDate} and ${endDate}` :
                                          time_filter ? `for ${time_filter}` : '';
                    responseMessage = `The store that made the least profit ${dateRangeText} was ${bottomStore} with a total revenue of ₹${minProfit.toFixed(2)}.`;
                } else {
                    responseMessage = `Could not determine the least profitable store ${dateRangeText}.`;
                }
            } else {
                responseMessage = `No sales data found to determine the least profitable store ${time_filter ? `for ${time_filter}` : ''}.`;
            }

        } else {
            // Existing logic for other query types
            query = supabase.from('sale_records').select('*');

            if (startDate && endDate) {
                query = query.gte('date', startDate).lte('date', endDate);
                console.log(`Supabase Query Date Range: ${startDate} to ${endDate}`);
            } else if (time_filter) { // Only log if time_filter was provided but no range could be determined
                console.warn(`Could not determine a precise date range for time_filter: '${time_filter}'. Proceeding without date filter.`);
            } else {
                console.log("No time filter specified. Querying all available dates.");
            }

            if (store_name) {
                query = query.ilike('store', `%${store_name}%`); // Case-insensitive partial match
                console.log(`Supabase Query Store Filter: ${store_name}`);
            }
            if (item_name) {
                query = query.ilike('item_name', `%${item_name}%`); // Case-insensitive partial match
                console.log(`Supabase Query Item Filter: ${item_name}`);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Supabase query error:', error);
                return res.status(500).json({ error: 'Error fetching data from database.' });
            }

            if (data && data.length > 0) {
                totalRevenue = data.reduce((sum, record) => sum + record.revenue, 0);
                totalQuantity = data.reduce((sum, record) => sum + record.quantity, 0);
                averageRevenue = totalRevenue / data.length;

                const dateRangeText = (startDate && endDate && startDate === endDate) ? `on ${startDate}` :
                                      (startDate && endDate) ? `between ${startDate} and ${endDate}` :
                                      time_filter ? `for ${time_filter}` : '';
                const storeText = store_name ? `for ${store_name}` : '';
                const itemText = item_name ? `for ${item_name}` : '';

                switch (query_type) {
                    case 'total_sales':
                        responseMessage = `Total sales ${storeText} ${itemText} ${dateRangeText} was ₹${totalRevenue.toFixed(2)} from ${totalQuantity} items.`;
                        break;
                    case 'average_revenue':
                        responseMessage = `Average revenue ${storeText} ${itemText} ${dateRangeText} was ₹${averageRevenue.toFixed(2)}.`;
                        break;
                    case 'items_sold':
                        responseMessage = `Total items sold ${storeText} ${itemText} ${dateRangeText} was ${totalQuantity}.`;
                        break;
                    case 'total_quantity':
                        responseMessage = `Total quantity sold ${storeText} ${itemText} ${dateRangeText} was ${totalQuantity}.`;
                        break;
                    case 'sales_for_store':
                        responseMessage = `Total sales for ${store_name} ${itemText} ${dateRangeText} was ₹${totalRevenue.toFixed(2)} from ${totalQuantity} items.`;
                        break;
                    default:
                        responseMessage = `For your query: "${userQuery}", I found total revenue of ₹${totalRevenue.toFixed(2)} and ${totalQuantity} items sold ${storeText} ${itemText} ${dateRangeText}.`;
                        break;
                }
            } else {
                responseMessage = `No sales data found for your request: "${userQuery}". Please try another query or adjust the time/store/item filters.`;
            }
        }

        res.json({ response: responseMessage });

    } catch (error) {
        console.error('Chatbot API unhandled error:', error);
        res.status(500).json({ error: 'An internal server error occurred. Check server logs for details.' });
    }
});

app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
