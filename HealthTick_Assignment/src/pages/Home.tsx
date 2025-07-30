import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import Calendar from '../components/Calender';
import AddClientForm from '../components/AddClientForm';
import Delete from '../assets/delete.svg';
import toast, { Toaster } from 'react-hot-toast';

type Slot = {
    id: string;
    callType: string;
    start: Date;
    end: Date,
    clientName: string
}
const Home = () => {
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [bookedSlots, setBookedSlots] = useState<Slot[]>([]);
    const [isAddClientOpen, setIsAddClientOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentDate(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);
    const time = format(currentDate, 'h:mm');
    const date = format(currentDate, 'EEE dd LLL');

    const getData = async () => {
        const response = await fetch(`${BACKEND_URL}/checkSlots?date=${currentDate.toISOString().split('T')[0]}`);
        const data = await response.json();
        console.log(data);
        setAvailableSlots(data.availableSlots);
        setBookedSlots(data.bookedSlots);
        setIsLoading(false);
    }
    useEffect(() => {
        setIsLoading(true);
        getData();
    }, []);

    const handleDeleteSlot = async (id: string) => {
        try {

            const response = await fetch(`${BACKEND_URL}/deleteSlot/${id}`, {
                method: 'DELETE',
            });
            const data = await response.json();
            console.log(data);
            getData();
            toast.success('Slot deleted successfully');
        } catch (error) {
            console.log(error);
        }
    };


    return (
        <>
            {
                isAddClientOpen &&
                <AddClientForm setIsAddClientOpen={setIsAddClientOpen} />
            }


            <div className='px-20 pt-6'>
                <Toaster position='top-center' reverseOrder={false} />

                <div className='flex items-center justify-between'>
                    <div className="text-2xl font-bold">
                        HealthTick
                    </div>
                    <div className='flex items-center gap-2 text-xl text-[#000000] opacity-70 font-normal'>
                        <div>
                            {time}
                        </div>
                        <div>
                            .
                        </div>
                        <div>
                            {date}
                        </div>
                        <div onClick={() => setIsAddClientOpen(true)} className='border px-2 py-1 rounded-full text-sm ml-5 shadow-xl cursor-pointer'>
                            Add Client
                        </div>
                    </div>
                </div>
                {
                    isLoading &&
                    <div className='flex justify-center items-center pt-20'>

                        <div className="animate-spin rounded-full h-10 w-10 border-t-4 border-blue-500 border-solid"></div>
                    </div>
                }
                {
                    !isLoading &&
                    <div className='flex gap-14 mt-24'>
                        <div className='w-[45%]'>

                            <div className='font-bold text-5xl text-[#000000] opacity-80 w-[60%]'>
                                Schedule a call with the clients
                            </div>
                            <div className=''>
                                <Calendar
                                    date={selectedDate}
                                    availableSlots={availableSlots}
                                    getData={getData}
                                />
                            </div>
                        </div>
                        <div className='w-[0.2px] border border-black opacity-10'></div>
                        <div className='w-[50%]'>
                            <div className='font-bold text-5xl text-[#000000] opacity-80 w-[70%]'>
                                Today's Bookings
                            </div>
                            <div style={{ scrollbarWidth: 'none' }} className='flex flex-wrap gap-4 h-96 overflow-y-scroll mt-20'>
                                {bookedSlots.map((slot, id) => {
                                    const start = new Date(slot.start);
                                    const end = new Date(slot.end);
                                    const durationInMinutes = Math.round((end.getTime() - start.getTime()) / 60000);

                                    return (
                                        <div key={id} className='flex items-start justify-between text-xl text-[#000000] opacity-90 font-normal border w-fit h-fit p-2 rounded shadow-md'>
                                            <div className='flex flex-col gap-3 text-lg'>

                                                <div> Time: {start.toLocaleTimeString()} </div>
                                                <div>Client Name: <span className='capitalize'>
                                                    {slot.clientName}
                                                </span>
                                                </div>
                                                <div>Call Type: <span className='capitalize'>
                                                    {slot.callType}
                                                </span>
                                                </div>

                                                <div>Duration: {durationInMinutes} min</div>
                                            </div>
                                            <div>
                                                <img onClick={() => handleDeleteSlot(slot.id)} className='cursor-pointer w-4 h-4 min-w-4 min-h-4 object-contain shrink-0' src={Delete} alt="delete icon" />
                                            </div>
                                        </div>
                                    );
                                })}

                            </div>
                        </div>
                    </div>

                }
            </div>

        </>
    )
}

export default Home
