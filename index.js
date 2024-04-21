const { createClient } = require('@supabase/supabase-js')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const PORT = 8080
require('dotenv').config()


const supabase = createClient(process.env.DATABASE_URL, process.env.DATABASE_KEY)

app.use(bodyParser.json())

app.get("/centerMetadata", async (_, response) => {
    try {
        const { data, error } = await supabase.from("center").select()
        return response.status(200).json(data)
    } catch (err) {
        return response.status(500).send(err.message)
    }
})

app.get("/gradeMetadata", async (_, response) => {
    try {
        const { data, error } = await supabase.from("grade").select();
        return response.status(200).json(data);
    } catch (err) {
        return response.status(500).send(err.message);
    }
});

app.get("/classMetadata", async (_, response) => {
    try {
        const { data, error } = await supabase.from("class").select(`
        *,
        center(centerName),
        session(sessionName)
        `);
        return response.status(200).json(data);
    } catch (err) {
        return response.status(500).send(err.message)
    }
})


app.get("/sessionMetadata", async (_, response) => {
    try {
        const { data, error } = await supabase.from("session").select()
        return response.status(200).json(data)
    } catch (err) {
        return response.status(500).send(err.message)
    }
})

app.get("/studentMetadata", async (_, response) => {
    try {
        const { data, error } = await supabase.from("student").select(`
        *,
        grade(gradeName),
        center(centerName)
        `)
        return response.status(200).json(data)
    } catch (err) {
        return response.status(500).send(err.message)
    }
})

app.get("/studentNameAndId", async (_, response) => {
    try {
        const { data, error } = await supabase.from("student").select(`
        id,
        name
        `)
        return response.status(200).json(data)
    } catch (err) {
        return response.status(500).send(err.message)
    }
})


app.get("/attendance", async (_, response) => {
    try {
        const { data, error } = await supabase.from("attendance").select(`
        *,
        student(name),
        class(day, startTime, endTime, centerId: center(id), centerName: center(centerName))
    `);

        return response.status(200).json(data)
    } catch (err) {
        return response.status(500).send(err.message)
    }
})

app.post("/attendance", async (request, response) => {
    try {
        const { date, studentId, classId } = request.body // Extract data from request body

        // Check if student with the given student ID exists
        const { data: existingStudent, error: studentError } = await supabase
            .from("student")
            .select("id")
            .eq("id", studentId)

        // Check for errors in student query
        if (studentError) {
            throw studentError
        }

        // If student does not exist, throw an error
        if (!existingStudent || existingStudent.length === 0) {
            throw new Error("Student with the provided ID does not exist")
        }

        // Check if attendance record already exists for the given date, studentId, and classId
        const { data: existingAttendance, error: existingError } = await supabase
            .from("attendance")
            .select("id")
            .eq("date", date)
            .eq("studentId", studentId)
            .eq("classId", classId)

        // Check for errors in existing attendance query
        if (existingError) {
            throw existingError
        }

        // If attendance record already exists, throw an error
        if (existingAttendance.length > 0) {
            throw new Error("Attendance record already exists for this date, student, and class")
        }

        // Insert the attendance record into the database
        const { data, error } = await supabase
            .from("attendance")
            .insert([{ date, studentId, classId }]);

        // Check for errors in insertion
        if (error) {
            throw error;
        }

        // Sending response with status 201 and JSON data
        return response.status(201).json(data);
    } catch (err) {
        // Sending error response with status 500 and error message
        return response.status(500).send(err.message);
    }
});

app.delete("/attendance/:id", async (request, response) => {
    try {
        const { id } = request.params

        const { data, error } = await supabase
            .from("attendance")
            .delete()
            .eq("id", id)

        if (error) {
            throw error
        }

        return response.status(200).json(data)
    } catch (err) {
        return response.status(500).send(err.message)
    }
})


app.listen(PORT, () => {
    console.log(`It's alive on http://localhost:${PORT}`)
})
