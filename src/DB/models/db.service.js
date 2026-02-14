import { providerEnum } from "../../common/enums/user.enum.js";

export const create = async ({ model, date }={}) => {
    return await model.create(date);
};

export const findOne = async ({ model, filter={},options={} }={}) => {
    const doc = model.findOne(filter);
    if (options.populate) {
     doc.populate(options.populate);
    }
    if (options.select) {
     doc.select(options.select);
    }
    if (options.skip) {
     doc.skip(options.skip);
    }
    if (options.sort) {
     doc.sort(options.sort);
    }
    if (options.limit) {
     doc.limit(options.limit);
    }
    return await doc.exec();

};
export const find = async ({ model, filter={},options={} }={}) => {
    const doc = model.find(filter);
    if (options.populate) {
     doc.populate(options.populate);
    }
    if (options.select) {
     doc.select(options.select);
    }
    if (options.skip) {
     doc.skip(options.skip);
    }
    if (options.sort) {
     doc.sort(options.sort);
    }
    if (options.limit) {
     doc.limit(options.limit);
    }
    return await doc.exec();
};


export const updateOne = async ({ model, filter={},update={},options={} }={}) => {
    const doc = model.updateOne(filter,update, {runValidators: true,...options});
   return await doc.exec();
};

export const findOneAndUpdate = async ({ model, filter={},update={},options={} }={}) => {
    const doc = model.findOneAndUpdate(filter,update, { new: true , runValidators: true,...options});
   return await doc.exec();
};
