class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
        excludedFields.forEach(el => delete queryObj[el]);

        // Advanced filtering for gte, gt, lte, lt
        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

        // Handle comma-separated values for status, priority, tags
        const parsedQuery = JSON.parse(queryStr);
        ['status', 'priority', 'tags'].forEach(key => {
            if (parsedQuery[key] && typeof parsedQuery[key] === 'string') {
                parsedQuery[key] = { $in: parsedQuery[key].split(',') };
            }
        });

        this.query = this.query.find(parsedQuery);
        return this;
    }

    search() {
        if (this.queryString.search) {
            const searchQuery = {
                $or: [
                    { title: { $regex: this.queryString.search, $options: 'i' } },
                    { description: { $regex: this.queryString.search, $options: 'i' } }
                ]
            };
            this.query = this.query.find(searchQuery);
        }
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        } else {
            this.query = this.query.sort('-createdAt'); // Default sort
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        } else {
            this.query = this.query.select('-__v');
        }
        return this;
    }

    paginate() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;
