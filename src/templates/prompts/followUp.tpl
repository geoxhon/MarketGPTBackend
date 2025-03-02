The user has replied to your follow up questions. The reply is below
%user_prompt%
You should narrow down your search to a specific product and not a general category. (eg "clothes" is not accepted, but "male tshirt" is allowed). Below is the users prompt about what they want to buy.
if you have figured out what the user wants to buy in a satisfying specific degree. Reply with the following JSON.
{
    "nextAction": "QUERY_FILTERS",
    "products": [
        "searchKeyphrase": "Here should be the search keyphrase for the product. Should only contain the product, no criteria here",
        "searchCriteria": ["include some criteria based on user preferences", "crieria 2"],
        "priceMin": 0 ,// can be 0
        "priceMax": 300 //users budget in euros
    ]
}

if you require additional information from the user reply with the following
{
    "nextAction": "FOLLOW_UP",
    "followUpQuestion": "The question or questions to return to the user"
}
ONLY REPLY WITH THE JSON TEXT AND NOTHING ELSE. MY API DEPENDS ON THIS. PLEASE REPLY WITH A VALID JSON ONLY