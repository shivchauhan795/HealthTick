import express from 'express';
import { db } from './utils/firebase';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    Timestamp,
    where
} from 'firebase/firestore';

const app = express();
app.use(express.json());
app.use(cors());
const PORT = process.env.PORT || 3000;


const SLOT_START = 10 * 60 + 30;
const SLOT_END = 19 * 60 + 30;


const getMinutes = (date: Date) => date.getHours() * 60 + date.getMinutes();

const isTimeAllowed = (date: Date) => {
    const mins = getMinutes(date);
    return mins >= SLOT_START && mins + 20 <= SLOT_END;
};

const isSlotAvailable = async (requestedStart: Date, duration: number) => {
    const requestedEnd = new Date(requestedStart.getTime() + duration * 60000);

    const slotsSnapshot = await getDocs(collection(db, 'slots'));

    for (const doc of slotsSnapshot.docs) {
        const slot = doc.data();
        const existingStart = slot.time.toDate();
        const existingDuration = slot.callType === 'onboarding' ? 40 : 20;
        const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);

        if (requestedStart < existingEnd && existingStart < requestedEnd) {
            return false;
        }
    }

    return true;
};

app.get('/', (req, res) => {
    res.send('Hello World!');
});

/*
{
    "id": "122456",
    "name": "john ji",
    "phone": "12345678587878"
}
*/
app.post('/addClient', async (req, res) => {
    const { id, name, phone } = req.body;
    try {
        const response = await addDoc(collection(db, "clients"), { id, name, phone });
        res.send(response);
    } catch (error) {
        console.log(error);
    }
})

app.get('/getClients', async (req, res) => {
    try {
        const snapshot = await getDocs(collection(db, "clients"));
        const clients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        res.status(200).json(clients);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error fetching clients");
    }
});


/*
{
  "clientId": "122456",
  "callType": "onboarding",
  "date": "2025-08-01",
  "time": "11:00"
}
*/
app.post('/bookSlot', async (req, res) => {
    const { clientId, callType, date, time } = req.body;

    try {
        const clientsSnapshot = await getDocs(query(collection(db, 'clients'), where('id', '==', clientId)));
        if (clientsSnapshot.empty) {
            return res.status(400).json({ error: 'Client does not exist.' });
        }

        const slotStart = new Date(`${date}T${time}`);
        const isOnboarding = callType === 'onboarding';
        const duration = isOnboarding ? 40 : 20;

        if (!isTimeAllowed(slotStart)) {
            return res.status(400).json({ error: 'Time must be between 10:30 AM and 7:30 PM.' });
        }

        const available = await isSlotAvailable(slotStart, duration);
        if (!available) {
            return res.status(409).json({ error: 'Slot overlaps with another booking.' });
        }

        await addDoc(collection(db, 'slots'), {
            id: uuidv4(),
            clientId,
            callType,
            date: Timestamp.fromDate(slotStart),
            time: Timestamp.fromDate(slotStart),
            recurring: isOnboarding,
            day: slotStart.getDay(),
            firstCallDate: Timestamp.fromDate(slotStart)
        });

        return res.status(200).json({ message: 'Slot booked successfully' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Something went wrong while booking.' });
    }
});



// /checkSlots?date=2025-08-01
app.get('/checkSlots', async (req, res) => {
    const { date } = req.query;

    if (!date) {
        return res.status(400).json({ error: 'Date query parameter is required in YYYY-MM-DD format' });
    }

    try {
        const dateString = typeof date === 'string' ? date : date.toString();
        const targetDate = new Date(dateString);
        targetDate.setHours(0, 0, 0, 0);

        const slotsSnap = await getDocs(query(collection(db, 'slots')));
        const clientsSnap = await getDocs(collection(db, 'clients'));

        const clientsMap = new Map();
        clientsSnap.forEach(doc => {
            const data = doc.data();
            clientsMap.set(data.id, data.name);
        });


        const bookedSlots = [];

        for (const doc of slotsSnap.docs) {
            const data = doc.data();
            const originalStart = data.date.toDate();

            const isSameDay = originalStart.toDateString() === targetDate.toDateString();
            const isRecurringMatch =
                data.recurring &&
                data.day === targetDate.getDay() &&
                originalStart <= targetDate;

            if (isSameDay || isRecurringMatch) {
                const timeStr = originalStart.toTimeString().substring(0, 5);
                const simulatedStart = new Date(`${date}T${timeStr}:00`);
                const duration = isSameDay ? 40 : 20;
                const simulatedEnd = new Date(simulatedStart.getTime() + duration * 60000);

                bookedSlots.push({
                    id: doc.id,
                    clientName: clientsMap.get(data.clientId) || 'Unknown',
                    callType: isSameDay ? data.callType : 'follow-up',
                    start: simulatedStart,
                    end: simulatedEnd,
                    recurring: data.recurring
                });
            }
        }

        const availableSlots = [];
        const businessStart = new Date(targetDate);
        businessStart.setHours(10, 30, 0, 0);
        const businessEnd = new Date(targetDate);
        businessEnd.setHours(19, 30, 0, 0);

        for (let time = new Date(businessStart); time < businessEnd; time = new Date(time.getTime() + 5 * 60000)) {
            const start = new Date(time);
            const end40 = new Date(start.getTime() + 40 * 60000);
            const end20 = new Date(start.getTime() + 20 * 60000);

            const overlap40 = bookedSlots.some(slot =>
                (start < slot.end && end40 > slot.start)
            );

            if (!overlap40) {
                availableSlots.push({ start, end: end40, duration: 40 });
            }
        }

        res.status(200).json({
            bookedSlots,
            availableSlots
        });

    } catch (error) {
        console.error('Error fetching slots:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.delete('/deleteSlot/:id', async (req, res) => {
    const slotId = req.params.id;

    try {
        await deleteDoc(doc(db, 'slots', slotId));
        res.status(200).json({ message: 'Slot deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not delete slot' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});