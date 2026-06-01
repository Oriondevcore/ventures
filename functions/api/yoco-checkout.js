 export const onRequest = async (context) => {                                                                                                                       
       const { request, env } = context;                                                                                                                                 
                                                                                                                                                                         
       if (request.method === 'OPTIONS') {                                                                                                                               
         return new Response(null, {                                                                                                                                     
           headers: {                                                                                                                                                    
             'Access-Control-Allow-Origin': '*',                                                                                                                         
             'Access-Control-Allow-Methods': 'POST, OPTIONS',                                                                                                            
             'Access-Control-Allow-Headers': 'Content-Type',                                                                                                             
           },                                                                                                                                                            
         });                                                                                                                                                             
       }                                                                                                                                                                 
                                                                                                                                                                         
       if (request.method !== 'POST') {                                                                                                                                  
         return Response.json({ error: 'Method not allowed' }, { status: 405 });                                                                                         
       }                                                                                                                                                                 
                                                                                                                                                                         
       try {                                                                                                                                                             
         const { amount, name, email, product, orderNumber } = await request.json();                                                                                     
                                                                                                                                                                         
         if (!amount || !name || !email || !product) {                                                                                                                   
           return Response.json({ error: 'Missing required fields' }, { status: 400 });                                                                                  
         }                                                                                                                                                               
                                                                                                                                                                         
         const amountInCents = Math.round(amount * 100);                                                                                                                 
         const orderRef = orderNumber || OV-$;{Date.now()};                                                                                                               
                                                                                                                                                                         
         const checkoutData = {                                                                                                                                          
           amount: amountInCents,                                                                                                                                        
           currency: 'ZAR',                                                                                                                                              
           meta: {                                                                                                                                                       
             customerName: name,                                                                                                                                         
             customerEmail: email,                                                                                                                                       
             orderNumber: orderRef,                                                                                                                                      
             product: product,                                                                                                                                           
             source: 'Naledi AI'                                                                                                                                         
           }                                                                                                                                                             
         };                                                                                                                                                              
                                                                                                                                                                         
         const yocoRes = await fetch('https://payments.yoco.com/api/checkouts', {                                                                                        
           method: 'POST',                                                                                                                                               
           headers: {                                                                                                                                                    
             'Authorization': Bearer ${env.YOCO_LIVE_SK},                                                                                                                
             'Content-Type': 'application/json'                                                                                                                          
           },                                                                                                                                                            
           body: JSON.stringify(checkoutData)                                                                                                                            
         });                                                                                                                                                             
                                                                                                                                                                         
         if (!yocoRes.ok) {                                                                                                                                              
           const err = await yocoRes.text();                                                                                                                             
           console.error('Yoco Error:', yocoRes.status, err);                                                                                                            
           return Response.json({ error: 'Payment link failed' }, { status: 502 });                                                                                      
         }                                                                                                                                                               
                                                                                                                                                                         
         const checkout = await yocoRes.json();                                                                                                                          
         return Response.json({                                                                                                                                          
           url: checkout.redirectUrl,                                                                                                                                    
           orderNumber: orderRef                                                                                                                                         
         });                                                                                                                                                             
                                                                                                                                                                         
       } catch (err) {                                                                                                                                                   
         console.error('Worker error:', err);                                                                                                                            
         return Response.json({ error: 'Server error' }, { status: 500 });                                                                                               
       }                                                                                                                                                                 
     };
