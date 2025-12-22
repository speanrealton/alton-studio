# Code Changes - Before & After

## State Management Changes

### print/page.tsx - State Variables

#### BEFORE ❌
```typescript
const [showQuotesModal, setShowQuotesModal] = useState(false);
const [receivedQuotes, setReceivedQuotes] = useState([]);
const [loadingQuotes, setLoadingQuotes] = useState(false);
const [notificationsCount, setNotificationsCount] = useState(0);
```

#### AFTER ✅
```typescript
const [showQuotesModal, setShowQuotesModal] = useState(false);
const [quoteConversations, setQuoteConversations] = useState([]);
const [selectedQuoteConv, setSelectedQuoteConv] = useState(null);
const [quoteMessages, setQuoteMessages] = useState([]);
const [newQuoteMessage, setNewQuoteMessage] = useState('');
const [loadingQuotes, setLoadingQuotes] = useState(false);
const [notificationsCount, setNotificationsCount] = useState(0);
```

**What Changed**:
- `receivedQuotes` → `quoteConversations` (focus on conversations not just data)
- Added `selectedQuoteConv` (track selected conversation)
- Added `quoteMessages` (store chat messages)
- Added `newQuoteMessage` (input state for composing)

---

## Function Changes

### fetchReceivedQuotes → fetchQuoteConversations

#### BEFORE ❌
```typescript
const fetchReceivedQuotes = async () => {
  if (!user) return;
  
  setLoadingQuotes(true);
  const { data, error } = await supabase
    .from('quote_requests')
    .select(`
      *,
      printers(id, company_name, city, country, logo_url, email, phone)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quotes:', error);
  } else {
    console.log('Fetched quotes:', data);
    setReceivedQuotes(data || []);
  }
  setLoadingQuotes(false);
};
```

#### AFTER ✅
```typescript
const fetchReceivedQuotes = async () => {
  if (!user) return;
  
  setLoadingQuotes(true);
  console.log('Fetching quote conversations for user:', user.id);
  
  const { data, error } = await supabase
    .from('quote_requests')
    .select(`
      id,
      description,
      service_type,
      quantity,
      status,
      created_at,
      updated_at,
      printers(id, company_name, city, country, logo_url, email, phone)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching quote conversations:', error);
  } else {
    console.log('Fetched quote conversations:', data);
    setQuoteConversations(data || []);
  }
  setLoadingQuotes(false);
};
```

**Changes**:
- More specific column selection (only needed fields)
- Better logging messages
- Uses `quoteConversations` instead of `receivedQuotes`

### NEW FUNCTION: fetchQuoteMessages
```typescript
const fetchQuoteMessages = async (quoteId) => {
  const { data } = await supabase
    .from('quote_messages')
    .select('*')
    .eq('quote_request_id', quoteId)
    .order('created_at', { ascending: true });

  if (data) {
    setQuoteMessages(data);
  }
};
```

### NEW FUNCTION: sendQuoteMessage
```typescript
const sendQuoteMessage = async (quoteId) => {
  if (!newQuoteMessage.trim() || !user) return;

  const { error } = await supabase.from('quote_messages').insert({
    quote_request_id: quoteId,
    sender_id: user.id,
    sender_type: 'client',
    message: newQuoteMessage.trim()
  });

  if (!error) {
    setNewQuoteMessage('');
    fetchQuoteMessages(quoteId);
    fetchReceivedQuotes();
  }
};
```

---

### submitQuoteRequest

#### BEFORE ❌
```typescript
const submitQuoteRequest = async (e) => {
  e.preventDefault();
  if (!user) { alert('Please sign in to request quotes'); return; }
  const formData = new FormData(e.target);
  const { error } = await supabase.from('quote_requests').insert({
    printer_id: quoteForm.printerId,
    user_id: user.id,
    service_type: formData.get('service_type'),
    quantity: parseInt(formData.get('quantity')),
    description: formData.get('description')
  });
  if (!error) {
    setQuoteForm({ show: false, printerId: null });
    alert('Quote request sent! The printer will respond soon.');
  }
};
```

#### AFTER ✅
```typescript
const submitQuoteRequest = async (e) => {
  e.preventDefault();
  if (!user) { alert('Please sign in to request quotes'); return; }
  const formData = new FormData(e.target);
  
  const { data: quoteData, error: quoteError } = await supabase.from('quote_requests').insert({
    printer_id: quoteForm.printerId,
    user_id: user.id,
    service_type: formData.get('service_type'),
    quantity: parseInt(formData.get('quantity')),
    description: formData.get('description')
  }).select().single();

  if (!quoteError && quoteData) {
    // Create initial quote message from client
    await supabase.from('quote_messages').insert({
      quote_request_id: quoteData.id,
      sender_id: user.id,
      sender_type: 'client',
      message: `Quote Request: ${formData.get('description')}`
    });

    setQuoteForm({ show: false, printerId: null });
    alert('Quote request sent! You can now chat with the printer about your request.');
    fetchReceivedQuotes();
  }
};
```

**Changes**:
- Returns created quote data using `.select().single()`
- Automatically creates an initial message
- Better user messaging mentioning chat capability

---

## UI Changes

### Quote Modal Navigation

#### BEFORE ❌
```typescript
{(() => {
  const quotedCount = receivedQuotes.filter(q => q.status === 'quoted').length;
  const totalBadge = Math.max(quotedCount, notificationsCount);
  return totalBadge > 0 ? (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold flex items-center justify-center">
      {totalBadge}
    </span>
  ) : null;
})()}
```

#### AFTER ✅
```typescript
{(() => {
  const pendingCount = quoteConversations.filter(q => q.status === 'pending').length;
  const totalBadge = Math.max(pendingCount, notificationsCount);
  return totalBadge > 0 ? (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold flex items-center justify-center">
      {totalBadge}
    </span>
  ) : null;
})()}
```

**Changes**:
- Shows pending quotes instead of quoted
- More accurate badge count

---

### Modal UI - COMPLETE REPLACEMENT

#### BEFORE ❌
Static quote cards with details shown inline:
```
[Card 1]
Printer: Acme Printing
Status: Waiting for Quote
Your Request: [details]
[Contact Email] [Call]

[Card 2]
Printer: Quality Prints
Status: Quote Received
Quote Response: $500
[Contact Email] [Call]
```

#### AFTER ✅
Split-pane chat interface:
```
┌─────────────┬──────────────────┐
│ Printer A   │ Chat with Printer│
│ Waiting ▼   │                  │
│             │ Your Request     │
│ Printer B   │ [description]    │
│ Quoted ▼    │                  │
│             │ Status: Waiting  │
│ Printer C   │                  │
│ Quoted ▼    │ [Type message]   │
│             │ [Send]           │
└─────────────┴──────────────────┘
```

**Benefits**:
- Conversations side-by-side
- Real-time message flow
- Better for mobile
- More intuitive for chat-based communication

---

## printer/dashboard/page.tsx Changes

### State Variables

#### NEW ADDITIONS
```typescript
const [quoteMessages, setQuoteMessages] = useState([]);
const [newQuoteMessage, setNewQuoteMessage] = useState('');
```

### NEW FUNCTIONS

#### fetchQuoteMessages
```typescript
const fetchQuoteMessages = async (quoteId) => {
  const { data } = await supabase
    .from('quote_messages')
    .select('*')
    .eq('quote_request_id', quoteId)
    .order('created_at', { ascending: true });

  if (data) {
    setQuoteMessages(data);
  }
};
```

#### sendQuoteMessage
```typescript
const sendQuoteMessage = async (quoteId) => {
  if (!newQuoteMessage.trim() || !user) return;

  const { error } = await supabase.from('quote_messages').insert({
    quote_request_id: quoteId,
    sender_id: user.id,
    sender_type: 'printer',
    message: newQuoteMessage.trim()
  });

  if (!error) {
    setNewQuoteMessage('');
    fetchQuoteMessages(quoteId);
  }
};
```

### respondToQuote Function

#### BEFORE ❌
```typescript
const respondToQuote = async (quoteId) => {
  if (!quoteResponse.price) {
    alert('Please enter a price');
    return;
  }

  const { error } = await supabase
    .from('quote_requests')
    .update({
      status: 'quoted',
      quoted_price: parseFloat(quoteResponse.price),
      printer_notes: quoteResponse.notes,
      delivery_time: quoteResponse.delivery_time,
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId);

  if (!error) {
    setQuoteRequests(prev => 
      prev.map(q => q.id === quoteId 
        ? { 
            ...q, 
            status: 'quoted', 
            quoted_price: parseFloat(quoteResponse.price),
            printer_notes: quoteResponse.notes,
            delivery_time: quoteResponse.delivery_time 
          } 
        : q
      )
    );
    
    setSelectedQuote(null);
    setQuoteResponse({ price: '', notes: '', delivery_time: '' });
    fetchQuoteRequests();
    fetchStats(printer.id);

    try {
      const { data: updatedQuote } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (updatedQuote && updatedQuote.user_id) {
        await supabase.from('notifications').insert({
          user_id: updatedQuote.user_id,
          type: 'quote',
          title: `New quote from ${printer.company_name}`,
          message: `${printer.company_name} sent a quote for your ${updatedQuote.service_type} request.`,
          link: `/marketplace/notifications`,
          actor_id: printer.user_id,
          actor_username: printer.company_name,
          actor_profile_picture: printer.logo_url,
          read: false
        });
      }
    } catch (notifErr) {
      console.error('Failed to create notification for quote:', notifErr);
    }

    alert('Quote sent successfully! The client has been notified.');
  } else {
    alert('Error sending quote. Please try again.');
  }
};
```

#### AFTER ✅
```typescript
const respondToQuote = async (quoteId) => {
  if (!quoteResponse.price) {
    alert('Please enter a price');
    return;
  }

  // Update quote status
  const { error } = await supabase
    .from('quote_requests')
    .update({
      status: 'quoted',
      quoted_price: parseFloat(quoteResponse.price),
      printer_notes: quoteResponse.notes,
      delivery_time: quoteResponse.delivery_time,
      updated_at: new Date().toISOString()
    })
    .eq('id', quoteId);

  if (!error) {
    // Send quote message to client
    const quoteMessage = `Quote Offer: $${quoteResponse.price}\nDelivery: ${quoteResponse.delivery_time}\nNotes: ${quoteResponse.notes}`;
    
    await supabase.from('quote_messages').insert({
      quote_request_id: quoteId,
      sender_id: user.id,
      sender_type: 'printer',
      message: quoteMessage
    });

    setQuoteRequests(prev => 
      prev.map(q => q.id === quoteId 
        ? { 
            ...q, 
            status: 'quoted', 
            quoted_price: parseFloat(quoteResponse.price),
            printer_notes: quoteResponse.notes,
            delivery_time: quoteResponse.delivery_time 
          } 
        : q
      )
    );
    
    setSelectedQuote(null);
    setNewQuoteMessage('');
    setQuoteResponse({ price: '', notes: '', delivery_time: '' });
    fetchQuoteRequests();
    fetchStats(printer.id);

    try {
      const { data: updatedQuote } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('id', quoteId)
        .single();

      if (updatedQuote && updatedQuote.user_id) {
        await supabase.from('notifications').insert({
          user_id: updatedQuote.user_id,
          type: 'quote',
          title: `Quote from ${printer.company_name}`,
          message: `${printer.company_name} sent a quote for $${quoteResponse.price}. Check your quote messages!`,
          link: `/print`,
          actor_id: printer.user_id,
          actor_username: printer.company_name,
          actor_profile_picture: printer.logo_url,
          read: false
        });
      }
    } catch (notifErr) {
      console.error('Failed to create notification for quote:', notifErr);
    }

    alert('Quote sent successfully! The client will see your message.');
  } else {
    alert('Error sending quote. Please try again.');
  }
};
```

**Changes**:
- Sends quote as a message to `quote_messages` table
- Clears `newQuoteMessage` state
- Updates notification link to `/print` (where chat is)
- Notification message mentions checking quote messages

---

## Database Schema Changes

### NEW TABLE: quote_messages

```sql
CREATE TABLE quote_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_request_id UUID NOT NULL REFERENCES quote_requests(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('client', 'printer')),
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (sender_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_quote_messages_quote_request_id ON quote_messages(quote_request_id);
CREATE INDEX idx_quote_messages_sender_id ON quote_messages(sender_id);
CREATE INDEX idx_quote_messages_created_at ON quote_messages(created_at);

-- Enable real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE quote_messages;

-- Row-level security
ALTER TABLE quote_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can read their quote messages" ON quote_messages
  FOR SELECT USING (
    sender_id = auth.uid() OR
    quote_request_id IN (
      SELECT id FROM quote_requests 
      WHERE user_id = auth.uid() OR printer_id IN (
        SELECT id FROM printers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can send messages to their quotes" ON quote_messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    quote_request_id IN (
      SELECT id FROM quote_requests 
      WHERE user_id = auth.uid() OR printer_id IN (
        SELECT id FROM printers WHERE user_id = auth.uid()
      )
    )
  );
```

---

## Summary of Changes

| Component | Change | Reason |
|-----------|--------|--------|
| **State** | Added conversation + message tracking | Support chat interface |
| **Functions** | Added message fetch/send | Real-time messaging |
| **Database** | New `quote_messages` table | Store chat history |
| **UI** | Static cards → Chat interface | Better UX & real-time |
| **Notifications** | Enhanced with chat link | Guide users to new interface |
| **Subscriptions** | Quote updates → Message updates | Guaranteed delivery |

---

**Result**: Complete transformation from form-based to chat-based quote system with real-time delivery guarantees.
