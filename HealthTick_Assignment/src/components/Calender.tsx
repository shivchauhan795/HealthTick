import { useEffect, useState } from "react";

type Props = {
  date: Date;
  availableSlots: any[];
  getData: any;
};

type ClientData = {
  id: string;
  name: string;
  phone: string;
};

export default function Calendar({
  date,
  availableSlots,
  getData
}: Props) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  const [clients, setClients] = useState<ClientData[]>([]);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedClient, setSelectedClient] = useState('');
  const [callType, setCallType] = useState("onboarding");

  const getClients = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/getClients`);
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getClients();
  }, []);

  function formatTime(isoString: string | number | Date) {
    return new Date(isoString).toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  function convertTo24Hour(timeStr: string) {
    const [time, modifier] = timeStr.toLowerCase().split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "pm" && hours !== 12) hours += 12;
    if (modifier === "am" && hours === 12) hours = 0;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}`;
  }


  const bookCall = async () => {

    try {
      const response = await fetch(`${BACKEND_URL}/bookSlot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          clientId: selectedClient,
          callType: callType,
          date: date.toISOString().split('T')[0],
          time: selectedSlot
        })
      })
      setCurrentStep(1);
      getData();
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="rounded pt-10 w-full flex flex-col gap-4">
      {currentStep === 1 && (
        <div style={{ scrollbarWidth: "none" }} className="grid grid-cols-6 gap-2 h-96 overflow-y-auto p-2 border rounded-xl">
          {availableSlots.map((slot, id) => (
            <div key={id} className="flex justify-center">
              <span
                className={`p-2 border border-black rounded-full cursor-pointer text-nowrap ${selectedSlot === convertTo24Hour(formatTime(slot.start))
                  ? "bg-red-400"
                  : "bg-green-400 hover:bg-green-300"
                  }`}
                onClick={() => {
                  setSelectedSlot(convertTo24Hour(formatTime(slot.start)));
                  setCurrentStep(2);
                }}
              >
                {formatTime(slot.start)}
              </span>
            </div>
          ))}
        </div>
      )}

      {currentStep === 2 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold mb-2">
            Select a potential client
          </h3>
          <div className="h-96 border overflow-y-scroll p-2 rounded-2xl" style={{ scrollbarWidth: "none" }}>

            {clients.map((client) => (
              <div
                key={client.id}
                className={`rounded px-3 py-2 cursor-pointer shadow-md hover:bg-blue-100 ${selectedClient === client.id ? "bg-blue-300" : ""
                  }`}
                onClick={() => {
                  setSelectedClient(client.id);
                  setCurrentStep(3);
                }}
              >
                <span className="font-medium uppercase">{client.name}</span> <br />
                <span className="text-sm text-gray-600">{client.phone}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentStep === 3 && selectedClient && (
        <div className="flex flex-col gap-4">
          <h3 className="text-lg font-semibold">Call Type</h3>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="callType"
                value="onboarding"
                checked={callType === "onboarding"}
                onChange={(e) => setCallType(e.target.value)}
              />
              Onboarding
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="callType"
                value="followup"
                checked={callType === "followup"}
                onChange={(e) => setCallType(e.target.value)}
              />
              Follow Up
            </label>
          </div>

          <button
            onClick={() => bookCall()}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-fit"
          >
            Book Call
          </button>
        </div>
      )}
    </div>
  );
}
