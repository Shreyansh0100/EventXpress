import mongoose from "mongoose";

const movieSchema = new mongoose.Schema(
    {
        title: {type: String, required: true},
        tagline: {type: String},
        overview: {type: String, required: true},
        poster_path: {type: String, required: true}, // Vertical Poster
        backdrop_path: {type: String, required: true}, // Horizontal Banner
        trailer_url: {type: String}, // YouTube Link
        release_date: {type: Date, required: true},
        genres: {type: Array, required: true}, // [{id: 1, name: "Action"}]
        runtime: {type: Number, required: true}, // In minutes
        
        // Indian Context Fields
        censor_rating: {type: String, enum: ["U", "U/A", "A", "S"], default: "U/A"},
        languages: {type: [String], default: ["Hindi"]}, // ["Hindi", "English"]
        formats: {type: [String], default: ["2D"]}, // ["2D", "IMAX 3D"]
        cast: {type: Array, default: []}, // [{name: "Shah Rukh Khan", role: "Actor", image: "url"}]
        
        vote_average: {type: Number, default: 0},
        vote_count: {type: Number, default: 0},
    }, {timestamps: true}
)

const Movie = mongoose.model('Movie', movieSchema)
export default Movie;